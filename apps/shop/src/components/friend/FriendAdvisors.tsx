import Image from "next/image";
import { Accent, Container, Section } from "@/components/ui";
import { asset } from "@/lib/asset";
import styles from "./FriendAdvisors.module.css";

type Advisor = {
  name: string;
  degrees: string;
  /** One line: what they are. */
  role: string;
  /** The essence of the biography, in two or three sentences. */
  bio: string;
  photo: string;
};

/** The Scientific Advisory Board, bios cut down to what matters. */
const ADVISORS: Advisor[] = [
  {
    name: "Tori Parker",
    degrees: "PhD, MS",
    role: "Nutrition scientist · product developer",
    bio: "PhD in nutrition from the University of Illinois Urbana-Champaign, specialising in food processing, food chemistry and human nutrition. Five years as a university professor and fifteen in industry: 100+ products developed, 30+ peer-reviewed papers, one patent.",
    photo: "/images/advisors/card/tori-parker.webp",
  },
  {
    name: "Ralph Jager",
    degrees: "PhD, MBA, FISSN",
    role: "Bioorganic chemist · sports nutrition",
    bio: "PhD in organic chemistry (University of Bonn), postdoc at Caltech, MBA. Former VP at an international ingredients company, co-founder of Increnovo. Runs clinical studies on sports nutrition and on brain, joint, heart and gut health; an expert in probiotics, prebiotics and postbiotics.",
    photo: "/images/advisors/card/ralph-jager.webp",
  },
  {
    name: "Michael Lila",
    degrees: "PhD, MSc, MBA",
    role: "Chemical engineer · ingredients and standards",
    bio: "PhD in chemical engineering (University of Wisconsin–Madison), 30+ peer-reviewed publications and several patents. Helped write technical standards for the American Herbal Products Association. Knows the whole chain, from raw materials to clinical research and finished products.",
    photo: "/images/advisors/card/michael-lila.webp",
  },
];

/**
 * The Scientific Advisory Board for the friend project: one card per member —
 * photo, name, degrees, a one-line role and a short bio.
 */
export function FriendAdvisors() {
  return (
    <Section tone="default" className={styles.section}>
      <Container className={styles.container}>
        <h2 className={styles.title}>
          Backed by a <Accent>Scientific Advisory Board</Accent>
        </h2>

        <ul className={styles.list}>
          {ADVISORS.map((a) => (
            <li key={a.name} className={styles.card}>
              <div className={styles.head}>
                <Image
                  className={styles.photo}
                  src={asset(a.photo)}
                  alt={`Portrait of ${a.name}`}
                  width={224}
                  height={256}
                />
                <div className={styles.who}>
                  <h3 className={styles.name}>{a.name}</h3>
                  <p className={styles.degrees}>{a.degrees}</p>
                  <p className={styles.role}>{a.role}</p>
                </div>
              </div>
              <p className={styles.bio}>{a.bio}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
