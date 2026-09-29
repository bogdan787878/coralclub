import Image from "next/image";
import { Accent, Container, Section } from "@/components/ui";
import styles from "./AdvisoryBoard.module.css";

export type AdvisoryMember = {
  name: string;
  credentials: string;
  photo: { src: string; alt: string };
};

export type AdvisoryBoardProps = {
  title: { lead: string; accent: string };
  members: AdvisoryMember[];
};

/**
 * AdvisoryBoard — the Scientific Advisory Board credibility block: heading
 * plus a row of member cards (headshot, name, credentials).
 */
export function AdvisoryBoard({ title, members }: AdvisoryBoardProps) {
  return (
    <Section tone="default" className={styles.section}>
      <Container className={styles.container}>
        <h2 className={styles.title}>
          {title.lead} <Accent>{title.accent}</Accent>
        </h2>

        <div className={styles.grid}>
          {members.map((m) => (
            <div className={styles.member} key={m.name}>
              <Image
                className={styles.photo}
                src={m.photo.src}
                alt={m.photo.alt}
                width={128}
                height={128}
              />
              <div className={styles.name}>{m.name}</div>
              <div className={styles.credentials}>{m.credentials}</div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
