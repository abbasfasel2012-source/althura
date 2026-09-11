import { createFileRoute } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | سياسة الخصوصية" },
      {
        name: "description",
        content: "سياسة الخصوصية لتطبيق الذرى الذكية.",
      },
      { property: "og:title", content: "الذرى الذكية | سياسة الخصوصية" },
      {
        property: "og:description",
        content: "سياسة الخصوصية لتطبيق الذرى الذكية.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PrivacyPolicyPage,
});

const policy = `# Privacy Policy - Althura

**Last Updated:** September 11, 2026

Welcome to Althura ("we," "our," "the App," "the Service"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application available at althura.lovable.app.

## 1. Information We Collect

We may collect the following types of information:

- **Account Information:** Name, email address, and any other data you provide when creating an account.
- **Usage Data:** Information about how you interact with the App (pages visited, features used, time spent).
- **Device Information:** Device type, operating system, IP address, and browser type.
- **Cookies:** To improve your experience and remember your preferences.

## 2. How We Use Your Information

We use the data we collect to:

- Provide, operate, and improve the App's services.
- Communicate with you about your account or important updates.
- Analyze usage to develop new features.
- Ensure the App's security and prevent misuse or fraud.

## 3. Sharing Your Information

We do not sell your personal data to any third party. We may only share your information in the following cases:

- With trusted service providers who help us operate the App (such as hosting services).
- To comply with legal requirements or official orders from competent authorities.
- To protect our rights or the safety of users in the event of a violation of our Terms of Use.

## 4. Data Security

We take reasonable measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet can be guaranteed to be 100% secure.

## 5. Your Rights

You have the right, at any time, to:

- Request access to the data we hold about you.
- Request correction or updating of your information.
- Request deletion of your account and personal data.
- Object to the processing of your data for certain purposes.

To exercise any of these rights, please contact us using the email below.

## 6. Cookies

The App may use cookies to improve the user experience. You can control cookie settings through your browser.

## 7. Children's Privacy

Our App is not intended for children under the age of 13, and we do not knowingly collect personal data from children. If we become aware of such data, we will delete it immediately.

## 8. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Any changes will be posted on this page, along with an updated "Last Updated" date above.

## 9. Contact Us

If you have any questions or concerns about this Privacy Policy, you can contact us at:

- **Email:** althura.contact@gmail.com
- **Owner/Administrator:** Abbas Fadhel
- **Website:** althura.lovable.app

---

*This Policy is part of the Terms of Use for the Althura application. Your continued use of the App constitutes your acceptance of the terms of this Policy.*`;

function PrivacyPolicyPage() {
  return (
    <AppShell title="سياسة الخصوصية">
      <article
        dir="ltr"
        className="mx-auto max-w-3xl rounded-3xl glass-strong p-5 text-left sm:p-8 lg:p-10"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-8 border-b border-border pb-2 text-xl font-bold text-foreground">
                {children}
              </h2>
            ),
            p: ({ children }) => (
              <p className="my-4 leading-8 text-muted-foreground">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="my-4 list-disc space-y-2 ps-6 text-muted-foreground">
                {children}
              </ul>
            ),
            li: ({ children }) => <li className="leading-7">{children}</li>,
            hr: () => <hr className="my-8 border-border" />,
            em: ({ children }) => (
              <em className="text-sm text-muted-foreground">{children}</em>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-foreground">{children}</strong>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-4"
              >
                {children}
              </a>
            ),
          }}
        >
          {policy}
        </ReactMarkdown>
      </article>
    </AppShell>
  );
}

export default PrivacyPolicyPage;
