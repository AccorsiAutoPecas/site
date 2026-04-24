import Link from "next/link";
import type { Metadata } from "next";

import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { LEGAL_TEXT_PUBLISHED_AT, LEGAL_TERMS_VERSION } from "@/config/legalDocuments";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: `Termos de uso da conta e da loja Accorsi Auto Peças (versão ${LEGAL_TERMS_VERSION}).`,
};

export default function TermosPage() {
  return (
    <LegalDocumentLayout
      title="Termos de uso"
      version={LEGAL_TERMS_VERSION}
      publishedAt={LEGAL_TEXT_PUBLISHED_AT}
    >
      <section>
        <h2>1. Aceitação</h2>
        <p>
          Ao criar uma conta ou utilizar o site da Accorsi Auto Peças (&quot;loja&quot;, &quot;nós&quot;), você declara ter
          lido e concordado com estes Termos de uso na versão {LEGAL_TERMS_VERSION}. O cadastro registra o aceite
          dessa versão para fins de comprovação, conforme descrito na nossa{" "}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
      </section>

      <section>
        <h2>2. Objeto</h2>
        <p>
          Estes termos regulam o uso do site, da conta de usuário e dos serviços disponibilizados pela loja, incluindo
          navegação, cadastro e, quando oferecidos, pedidos e atendimento.
        </p>
      </section>

      <section>
        <h2>3. Conta de usuário</h2>
        <p>
          Você é responsável pela veracidade dos dados informados e pela confidencialidade da senha. Comunique-nos
          imediatamente em caso de uso não autorizado da sua conta. Podemos suspender ou encerrar contas em caso de
          violação destes termos ou de uso que prejudique terceiros ou o funcionamento da loja.
        </p>
      </section>

      <section>
        <h2>4. Uso permitido</h2>
        <p>É vedado utilizar o site para fins ilícitos, para transmitir conteúdo ofensivo ou nocivo, ou para:</p>
        <ul>
          <li>acessar sistemas ou dados sem autorização;</li>
          <li>sobrecargar ou prejudicar a infraestrutura (incluindo ataques automatizados);</li>
          <li>reproduzir ou explorar comercialmente conteúdos da loja sem permissão expressa.</li>
        </ul>
      </section>

      <section>
        <h2>5. Produtos, preços e disponibilidade</h2>
        <p>
          Informações de produtos, preços e estoque são exibidas conforme disponibilidade no sistema. Fotos e descrições
          têm caráter meramente ilustrativo quando aplicável. Eventuais divergências serão tratadas conforme a
          legislação aplicável e a política de atendimento da loja.
        </p>
      </section>

      <section>
        <h2>6. Limitação de responsabilidade</h2>
        <p>
          Empregamos esforços razoáveis para manter o site disponível e seguro. Na medida permitida pela lei, a loja não
          se responsabiliza por danos indiretos, lucros cessantes ou interrupções causadas por fatores fora do nosso
          controle razoável (incluindo falhas de internet ou de terceiros).
        </p>
      </section>

      <section>
        <h2>7. Alterações dos termos</h2>
        <p>
          Podemos atualizar estes Termos. A versão vigente será sempre indicada nesta página. Quando a mudança exigir
          novo consentimento, informaremos no cadastro ou por meios adequados. O uso continuado do site após a
          publicação pode significar aceite da nova versão, conforme aplicável.
        </p>
      </section>

      <section>
        <h2>8. Contato</h2>
        <p>
          Dúvidas sobre estes Termos:{" "}
          <a href="mailto:contato@accorsi.com.br">contato@accorsi.com.br</a>. Questões sobre dados pessoais: veja o
          canal indicado na <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
      </section>

      <p className="text-store-navy-muted">
        Documento relacionado:{" "}
        <Link href="/privacidade">Política de Privacidade (versão aplicável na data de publicação)</Link>.
      </p>
    </LegalDocumentLayout>
  );
}
