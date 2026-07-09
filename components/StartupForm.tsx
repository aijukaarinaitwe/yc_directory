"use client";

import React, { useState, useActionState } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { formSchema } from "@/lib/validation";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createPitch, updateStartup } from "@/lib/actions";
import ImageUpload from "@/components/ImageUpload";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <Skeleton className="mt-3 h-[300px] w-full rounded-[20px]" />,
});

interface StartupFormProps {
  mode?: "create" | "edit";
  startupId?: string;
  initialValues?: {
    title: string;
    description: string;
    category: string;
    image: string;
    pitch: string;
  };
}

const StartupForm = ({
  mode = "create",
  startupId,
  initialValues,
}: StartupFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [pitch, setPitch] = useState(initialValues?.pitch ?? "");
  const [imageUrl, setImageUrl] = useState(initialValues?.image ?? "");
  const [isImageUploading, setIsImageUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleFormSubmit = async (prevState: any, formData: FormData) => {
    try {
      const formValues = {
        title,
        description,
        category,
        link: imageUrl,
        pitch,
      };

      await formSchema.parseAsync(formValues);

      const result =
        mode === "edit" && startupId
          ? await updateStartup(startupId, prevState, formData, pitch)
          : await createPitch(prevState, formData, pitch);

      if (result.status == "SUCCESS") {
        toast({
          title: "Success",
          description:
            mode === "edit"
              ? "Your startup pitch has been updated successfully"
              : "Your startup pitch has been created successfully",
        });

        router.push(`/startup/${result._id}`);
      } else if (result.fieldErrors) {
        setErrors(result.fieldErrors as Record<string, string>);
        toast({
          title: "Error",
          description: "Please check your inputs and try again",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErorrs = error.flatten().fieldErrors;

        setErrors(fieldErorrs as unknown as Record<string, string>);

        // Only clear the field(s) that actually failed validation so the
        // user doesn't have to retype everything that was already valid.
        if (fieldErorrs.title) setTitle("");
        if (fieldErorrs.description) setDescription("");
        if (fieldErorrs.category) setCategory("");
        if (fieldErorrs.link) setImageUrl("");
        if (fieldErorrs.pitch) setPitch("");

        toast({
          title: "Error",
          description: "Please check your inputs and try again",
          variant: "destructive",
        });

        return { ...prevState, error: "Validation failed", status: "ERROR" };
      }

      toast({
        title: "Error",
        description: "An unexpected error has occurred",
        variant: "destructive",
      });

      return {
        ...prevState,
        error: "An unexpected error has occurred",
        status: "ERROR",
      };
    }
  };

  const [state, formAction, isPending] = useActionState(handleFormSubmit, {
    error: "",
    status: "INITIAL",
  });

  return (
    <form action={formAction} className="startup-form">
      <div>
        <label htmlFor="title" className="startup-form_label">
          Title
        </label>
        <Input
          id="title"
          name="title"
          className="startup-form_input"
          required
          placeholder="Startup Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {errors.title && <p className="startup-form_error">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="startup-form_label">
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          className="startup-form_textarea"
          required
          placeholder="Startup Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {errors.description && (
          <p className="startup-form_error">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="startup-form_label">
          Category
        </label>
        <Input
          id="category"
          name="category"
          className="startup-form_input"
          required
          placeholder="Startup Category (Tech, Health, Education...)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {errors.category && (
          <p className="startup-form_error">{errors.category}</p>
        )}
      </div>

      <div>
        <label htmlFor="link" className="startup-form_label">
          Image
        </label>
        <ImageUpload
          name="link"
          value={imageUrl}
          onChange={setImageUrl}
          onUploadingChange={setIsImageUploading}
          error={errors.link}
        />
      </div>

      <div data-color-mode="light">
        <label htmlFor="pitch" className="startup-form_label">
          Pitch
        </label>

        <MDEditor
          value={pitch}
          onChange={(value) => setPitch(value as string)}
          id="pitch"
          preview="edit"
          height={300}
          style={{ borderRadius: 20, overflow: "hidden" }}
          textareaProps={{
            placeholder:
              "Briefly describe your idea and what problem it solves",
          }}
          previewOptions={{
            disallowedElements: ["style"],
          }}
        />

        {errors.pitch && <p className="startup-form_error">{errors.pitch}</p>}
      </div>

      <Button
        type="submit"
        className="startup-form_btn text-white"
        disabled={isPending || isImageUploading || !imageUrl}
      >
        {isImageUploading
          ? "Uploading image..."
          : isPending
            ? mode === "edit"
              ? "Saving..."
              : "Submitting..."
            : mode === "edit"
              ? "Save Changes"
              : "Submit Your Pitch"}
        <Send className="size-6 ml-2" />
      </Button>
    </form>
  );
};

export default StartupForm;
