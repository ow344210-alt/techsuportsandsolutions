// src/components/TextBlock.tsx
// Reusable single-paragraph section (eyebrow + heading + paragraph).
// Used for Leadership Philosophy, Why We Started, Culture, Future Goals,
// Why Clients Trust — each just passes a different `section` name.
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";

interface TextBlockProps {
  section: string;
  defaultEyebrow?: string;
  defaultHeading?: string;
  defaultParagraph?: string;
}

function TextBlock({ section, defaultEyebrow = "", defaultHeading = "", defaultParagraph = "" }: TextBlockProps) {
  const { content } = useSiteContent(section, {
    eyebrow: defaultEyebrow,
    heading: defaultHeading,
    paragraph: defaultParagraph,
  });

  return (
    <Section spacing="tight" maxWidth="text" className="bg-[#0B1220] text-white">
      <div className="text-center" data-aos="fade-up">
        <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
          {content.eyebrow}
        </span>
        <h3 className="mt-6 text-3xl font-bold">{content.heading}</h3>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-400">{content.paragraph}</p>
      </div>
    </Section>
  );
}

export default TextBlock;