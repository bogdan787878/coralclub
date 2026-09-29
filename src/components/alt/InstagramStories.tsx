"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { Container, Section } from "@/components/ui";
import styles from "./InstagramStories.module.css";

export type Story = { src: string; alt: string; label: string };

export type InstagramStoriesProps = {
  title: string;
  body: string;
  stories: Story[];
};

/**
 * InstagramStories — real community clips (same footage as the main site's
 * CommunityReels) presented as a row of tappable story rings, the way most
 * benchmarked brands surface Instagram content as social proof. Each ring
 * plays muted while in view; tapping toggles play/pause.
 */
export function InstagramStories({ title, body, stories }: InstagramStoriesProps) {
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const root = trackRef.current;
    if (!root) return;
    const videos = Array.from(root.querySelectorAll("video"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) void video.play().catch(() => {});
          else video.pause();
        }
      },
      { threshold: 0.6 },
    );
    for (const v of videos) io.observe(v);
    return () => io.disconnect();
  }, [stories]);

  const toggle = (e: MouseEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };

  return (
    <Section tone="default">
      <Container>
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.body}>{body}</p>
        </div>
      </Container>

      <ul className={styles.track} ref={trackRef} role="list" aria-label="Instagram stories">
        {stories.map((s, i) => (
          <li className={styles.item} key={i}>
            <button type="button" className={styles.ring} aria-label={s.label}>
              <span className={styles.ringInner}>
                <video
                  className={styles.video}
                  src={s.src}
                  aria-label={s.alt}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onClick={toggle}
                />
              </span>
            </button>
            <span className={styles.label}>{s.label}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
