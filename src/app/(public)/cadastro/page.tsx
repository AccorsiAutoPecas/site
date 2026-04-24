import { CadastroForm } from "@/features/auth/components/CadastroForm";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";

export default function CadastroPage() {
  return (
    <AuthPageShell
      title="Criar conta"
      description="Preencha os dados abaixo. Os aceites de Termos e Privacidade são obrigatórios."
    >
      <CadastroForm />
    </AuthPageShell>
  );
}
