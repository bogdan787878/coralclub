"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { Accent, Container, Heading, Section } from "@/components/ui";
import styles from "./CommunityReels.module.css";

export type Reel = {
  /** Video file path (in /public, already run through asset()). */
  src: string;
  /** What the clip shows — used as the accessible label. */
  alt: string;
  /** Optional poster frame shown before playback. */
  poster?: string;
};

export type CommunityReelsProps = {
  /** sans lead + Newton-italic accent. */
  title: { lead: string; accent: string };
  /** Supporting line under the heading. */
  body: string;
  reels: Reel[];
};

/**
 * CommunityReels — a horizontal, full-bleed strip of vertical member clips.
 * Each clip plays muted + looped only while it is on screen (Intersection
 * Observer), so the strip stays cheap to scroll past.
 */
export function CommunityReels({ title, body, reels }: CommunityReelsProps) {
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const root = trackRef.current;
    if (!root) return;

    const videos = Array.from(root.querySelectorAll("video"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.6 },
    );

    for (const video of videos) io.observe(video);
    return () => io.disconnect();
  }, [reels]);

  const toggle = (event: MouseEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  };

  return (
    <Section>
      <div className={styles.head}>
        <Container>
          <Heading as="h2" className={styles.title}>
            {title.lead} <Accent>{title.accent}</Accent>
          </Heading>
          <p className={styles.body}>{body}</p>
        </Container>
      </div>

      <ul className={styles.track} ref={trackRef} aria-label="Community clips" role="list">
        {reels.map((reel, i) => (
          <li className={styles.item} key={i}>
            <video
              className={styles.video}
              src={reel.src}
              poster={reel.poster}
              aria-label={reel.alt}
              muted
              loop
              playsInline
              preload="metadata"
              onClick={toggle}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
