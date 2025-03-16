import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const registrationSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  phone: z.string().min(1, "Telefonnummer ist erforderlich"),
  message: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface EventRegistrationFormProps {
  eventId: number;
  onSuccess?: () => void;
}

export default function EventRegistrationForm({ eventId, onSuccess }: EventRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/register-external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Anmeldung fehlgeschlagen');
      }

      toast({
        title: "Anmeldung erfolgreich!",
        description: "Sie erhalten in Kürze eine Bestätigungs-E-Mail mit allen Details.",
      });

      onSuccess?.();
      form.reset();
    } catch (error) {
      toast({
        title: "Fehler bei der Anmeldung",
        description: "Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Vorname</Label>
          <Input
            id="firstName"
            {...form.register("firstName")}
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Nachname</Label>
          <Input
            id="lastName"
            {...form.register("lastName")}
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          type="tel"
          {...form.register("phone")}
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Nachricht (optional)</Label>
        <Textarea
          id="message"
          {...form.register("message")}
          placeholder="Haben Sie noch Fragen oder Anmerkungen?"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Wird gesendet..." : "Jetzt anmelden"}
      </Button>

      <p className="text-sm text-muted-foreground text-center mt-4">
        Nach der Anmeldung erhalten Sie eine Bestätigungs-E-Mail mit allen Details zum Event.
      </p>
    </form>
  );
}