import type { Metadata } from "next";
import { QuizFlow } from "@/components/quiz";

export const metadata: Metadata = {
  title: "Подбор протокола — Coral Club",
  description:
    "Ответь на несколько вопросов о самочувствии и целях — получишь персональный протокол по фазам и подборку продуктов.",
};

export default function QuizPage() {
  return <QuizFlow />;
}
