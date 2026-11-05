import type { Metadata } from "next";
import { QuizFlow } from "@/components/quiz";

export const metadata: Metadata = {
  title: "Find Your Protocol — Coral Club",
  description:
    "Answer a few questions about how you feel and your goals — get a personal protocol by phase and a matching product selection.",
};

export default function QuizPage() {
  return <QuizFlow />;
}
