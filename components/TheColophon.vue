<script setup lang="ts">
/**
 * The colophon — a magazine's closing imprint. Quiet, typeset, sets the source
 * and the craft note. No CTA shouting; the chrome stays out of the way.
 */
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-32 border-t border-ink-600 bg-ink-950">
    <div class="container-spread py-16">
      <div class="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p class="font-serif text-3xl font-semibold text-bone-100">Reel</p>
          <p class="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            A film magazine for anime. Cover plates, feature spreads, and a
            running index — assembled from the MyAnimeList catalogue.
          </p>
        </div>

        <div>
          <p class="kicker">Sections</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li>
              <NuxtLink
                to="/"
                class="rounded-sm text-bone-300 transition-colors hover:text-ember"
                >The Cover</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/browse"
                class="rounded-sm text-bone-300 transition-colors hover:text-ember"
                >The Index</NuxtLink
              >
            </li>
          </ul>
        </div>

        <div>
          <p class="kicker">Colophon</p>
          <p class="mt-4 text-sm leading-relaxed text-muted">
            Data by the
            <!-- Persistent underline so the inline link is distinguishable
                 without relying on color alone (WCAG 1.4.1). Hover color is a
                 layered enhancement, not the sole signal. -->
            <a
              href="https://jikan.moe"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-sm text-bone-300 underline underline-offset-4 transition-colors hover:text-ember"
              >Jikan API</a
            >. Set in Fraunces &amp; Hanken Grotesk. Built with Nuxt 3.
          </p>
        </div>
      </div>

      <div
        class="mt-14 flex flex-col gap-2 border-t border-ink-600 pt-6 text-xs text-muted-dim sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="font-mono uppercase tracking-[0.14em]">
          Issue Nº 01 · {{ year }}
        </p>
        <p>An interface study by Joshua David Sta Rita.</p>
      </div>
    </div>
  </footer>
</template>
