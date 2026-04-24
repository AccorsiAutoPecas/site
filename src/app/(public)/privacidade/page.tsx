import Link from "next/link";
import type { Metadata } from "next";

import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { LEGAL_PRIVACY_VERSION, LEGAL_TEXT_PUBLISHED_AT } from "@/config/legalDocuments";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Política de Privacidade da Accorsi Auto Peças (versão ${LEGAL_PRIVACY_VERSION}).`,
};

export default function PrivacidadePage() {
  return (
    <LegalDocumentLayout
      title="Política de Privacidade"
      version={LEGAL_PRIVACY_VERSION}
      publishedAt={LEGAL_TEXT_PUBLISHED_AT}
    >
      <section>
        <h2>1. Quem somos</h2>
        <p>
          Esta Política descreve como a Accorsi Auto Peças trata dados pessoais no contexto do site e da conta de
          usuário. A versão {LEGAL_PRIVACY_VERSION} corresponde ao texto aceito no cadastro quando indicado no
          formulário; versões anteriores podem ser mantidas em arquivo interno para comprovação de consentimentos.
        </p>
      </section>

      <section>
        <h2>2. Finalidades e bases legais (LGPD)</h2>
        <p>Tratamos dados para:</p>
        <ul>
          <li>
            <strong>Criar e manter sua conta</strong> — execução do contrato e procedimentos preliminares (cadastro,
            autenticação, suporte).
          </li>
          <li>
            <strong>Cumprir obrigações legais</strong> — quando a lei exigir retenção ou comunicação a autoridades.
          </li>
          <li>
            <strong>Consentimento</strong> — quando aplicável para finalidades específicas que dependam de consentimento
            livre e informado (por exemplo, comunicações opcionais, se oferecidas).
          </li>
        </ul>
        <p>
          Dados de entrega e pagamento em pedidos futuros, quando existirem, serão tratados para execução do contrato de
          compra e cumprimento legal, conforme informado no checkout.
        </p>
      </section>

      <section>
        <h2>3. Dados que podemos tratar</h2>
        <ul>
          <li>Dados de cadastro e perfil: nome, e-mail e demais campos que você informar.</li>
          <li>Dados de autenticação geridos pelo provedor de identidade (senha de forma segura; não armazenamos a senha em texto claro).</li>
          <li>Registros de aceite: instantes e versões dos Termos e desta Política aceitos no cadastro.</li>
          <li>Dados técnicos mínimos: cookies estritamente necessários de sessão (ver item 7).</li>
        </ul>
      </section>

      <section>
        <h2>4. Compartilhamento e subprocessadores</h2>
        <p>
          Utilizamos o Supabase como infraestrutura de autenticação e banco de dados. O Supabase pode processar dados
          conforme sua política e local de processamento; contratamos o serviço para viabilizar a loja e aplicamos
          medidas contratuais e técnicas adequadas ao contexto.
        </p>
      </section>

      <section>
        <h2>5. Prazos de retenção</h2>
        <p>
          Mantemos os dados enquanto sua conta estiver ativa ou conforme necessário para cumprir obrigações legais,
          resolver disputas e fazer valer acordos. Após exclusão da conta, poderemos manter registros mínimos exigidos
          por lei ou anonimizados quando possível.
        </p>
      </section>

      <section>
        <h2>6. Seus direitos (Art. 18 da LGPD)</h2>
        <p>Você pode solicitar, conforme a lei:</p>
        <ul>
          <li>confirmação da existência de tratamento;</li>
          <li>acesso aos dados;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
          <li>portabilidade dos dados a outro fornecedor, observadas normas da autoridade;</li>
          <li>eliminação dos dados pessoais tratados com consentimento, quando aplicável;</li>
          <li>informação sobre compartilhamentos;</li>
          <li>revogação do consentimento, quando o tratamento depender dele.</li>
        </ul>
        <p>
          Pedidos podem ser feitos pelo e-mail{" "}
          <a href="mailto:privacidade@accorsi.com.br">privacidade@accorsi.com.br</a>. Atenderemos solicitações referentes
          aos seus direitos, inclusive portabilidade e cópia dos dados, mediante solicitação autenticada pelos canais
          indicados.
        </p>
      </section>

      <section>
        <h2>7. Cookies e tecnologias similares</h2>
        <p>
          Usamos cookies estritamente necessários para manter sua sessão de login (por exemplo, após autenticação via
          Supabase). Se no futuro utilizarmos cookies analíticos ou de marketing, atualizaremos esta Política e
          solicitaremos consentimento quando exigido.
        </p>
      </section>

      <section>
        <h2>8. Segurança</h2>
        <p>
          Adotamos práticas razoáveis de segurança para proteger dados contra acessos não autorizados e situações
          acidentais ou ilícitas. Nenhum sistema é totalmente isento de risco; em caso de incidente relevante, seguiremos
          as obrigações legais de comunicação.
        </p>
      </section>

      <section>
        <h2>9. Alterações desta Política</h2>
        <p>
          Podemos atualizar este texto. A versão vigente será publicada nesta página com data e identificador de versão.
          Alterações relevantes podem exigir novo aceite no cadastro ou aviso por e-mail, conforme o caso.
        </p>
      </section>

      <section>
        <h2>10. Contato</h2>
        <p>
          Encarregado ou canal de privacidade:{" "}
          <a href="mailto:privacidade@accorsi.com.br">privacidade@accorsi.com.br</a>. Demais assuntos:{" "}
          <a href="mailto:contato@accorsi.com.br">contato@accorsi.com.br</a>.
        </p>
      </section>

      <p className="text-store-navy-muted">
        Documento relacionado: <Link href="/termos">Termos de uso</Link>.
      </p>
    </LegalDocumentLayout>
  );
}
