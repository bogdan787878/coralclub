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

/** Те же люди по-русски (главная участника в кабинете). */
const ADVISORS_RU: Advisor[] = [
  {
    name: "Тори Паркер",
    degrees: "PhD, MS",
    role: "Нутрициолог · разработчик продуктов",
    bio: "PhD по питанию Иллинойсского университета в Урбане-Шампейне: технология и химия пищевых продуктов, питание человека. Пять лет преподавала в университете и пятнадцать работает в индустрии: более 100 разработанных продуктов, 30+ научных статей, патент.",
    photo: "/images/advisors/card/tori-parker.webp",
  },
  {
    name: "Ральф Ягер",
    degrees: "PhD, MBA, FISSN",
    role: "Биоорганический химик · спортивное питание",
    bio: "PhD по органической химии (Боннский университет), постдок в Калтехе, MBA. Был вице-президентом международной компании ингредиентов, сооснователь Increnovo. Ведёт клинические исследования спортивного питания, здоровья мозга, суставов, сердца и кишечника; эксперт по пробиотикам, пребиотикам и постбиотикам.",
    photo: "/images/advisors/card/ralph-jager.webp",
  },
  {
    name: "Майкл Лила",
    degrees: "PhD, MSc, MBA",
    role: "Инженер-химик · ингредиенты и стандарты",
    bio: "PhD по химической технологии (Висконсинский университет в Мадисоне), 30+ научных публикаций и несколько патентов. Участвовал в разработке технических стандартов Американской ассоциации растительных продуктов. Знает всю цепочку: от сырья до клинических исследований и готового продукта.",
    photo: "/images/advisors/card/michael-lila.webp",
  },
];

/**
 * The Scientific Advisory Board for the friend project: one card per member —
 * photo, name, degrees, a one-line role and a short bio. `lang="ru"` — для главной участника.
 */
export function FriendAdvisors({ lang = "en" }: { lang?: "en" | "ru" } = {}) {
  const ru = lang === "ru";
  const list = ru ? ADVISORS_RU : ADVISORS;
  return (
    <Section tone="default" className={styles.section}>
      <Container className={styles.container}>
        <h2 className={styles.title}>
          {ru ? (
            <>
              За продуктами — <Accent>научный совет</Accent>
            </>
          ) : (
            <>
              Backed by a <Accent>Scientific Advisory Board</Accent>
            </>
          )}
        </h2>

        <ul className={styles.list}>
          {list.map((a) => (
            <li key={a.name} className={styles.card}>
              <div className={styles.head}>
                <Image
                  className={styles.photo}
                  src={asset(a.photo)}
                  alt={ru ? `Портрет: ${a.name}` : `Portrait of ${a.name}`}
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
