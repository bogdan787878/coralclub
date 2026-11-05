import type { Metadata } from "next";
import { MAIN_SITE_URL } from "@/lib/beautySystem";
import { PRIVACY_POLICY_URL } from "@/lib/leads";
import { LandingHeader } from "@/components/landing/LandingHeader";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных — Coral Club",
  robots: { index: false, follow: false },
};

/** Where a withdrawal of consent is sent (the RU support mailbox on coralclub.ru). */
const WITHDRAW_EMAIL = "support.ru@coral-club.com";

/** The full text of the consent the lead form links to. */
export default function ConsentPage() {
  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="home">
        <LandingHeader homeHref={MAIN_SITE_URL} />
        <article className={styles.card}>
          <h1 className={styles.title}>
            Согласие на обработку персональных данных
          </h1>

          <p>
            Я, действуя свободно, своей волей и в своем интересе, даю согласие
            ООО «Эковита», ИНН 9726108730, КПП 772601001, ОГРН: 1257700561645,
            адрес местонахождения: 117648, вн. тер. г. Муниципальный округ
            Чертаново Северное, мкр. Северное Чертаново, д. 5 К. Г, помещ. 6Ц.
            (далее – Оператор) на обработку моих персональных данных: имя, адрес
            электронной почты, номер телефона.
          </p>
          <p>
            <strong>Цель обработки:</strong> запись на бесплатную консультацию
            нутрициолога, связь со мной для подтверждения, переноса или отмены
            консультации.
          </p>
          <p>
            <strong>Действия с персональными данными:</strong> сбор, запись,
            систематизация, накопление, хранение, уточнение, извлечение,
            использование, передача третьим лицам - консультантам-нутрициологам
            (предоставление, доступ), блокирование, удаление, уничтожение –
            с использованием средств автоматизации и без них, с использованием
            сети интернет и без.
          </p>
          <p>
            Для достижения указанной цели персональные данные могут быть
            переданы консультантам-нутрициологам, членам клуба coralclub.
          </p>
          <p>
            Согласие действует до достижения цели обработки, но не более 1
            (одного) года с даты его предоставления. Я вправе отозвать согласие
            в любой момент, направив заявление на адрес электронной почты{" "}
            <a href={`mailto:${WITHDRAW_EMAIL}`}>{WITHDRAW_EMAIL}</a>{" "}
            или по адресу местонахождения ООО «Эковита», указанному выше.
          </p>
          <p className={styles.more}>
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Политика конфиденциальности
            </a>
          </p>
        </article>
      </main>
    </div>
  );
}
