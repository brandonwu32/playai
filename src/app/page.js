import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className='logo-container'>
            <Image
                className={'playai'}
                src="https://play.ai/img/PlayLogo-onDarkSurfaces.svg"
                alt="none"
                width={360}
                height={180}
              />
          </div>
        <ol>
          <li>
            Choose a <code>PDF</code> you'd like to be read aloud.
          </li>
          <li>Let's Begin!</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="/start"
          >
            Let's Begin
          </a>
          <a
            href="https://docs.play.ai/documentation/get-started/introduction"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
      </main>
    </div>
  );
}
