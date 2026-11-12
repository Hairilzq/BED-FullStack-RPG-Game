<script>
  export let name = "";
  let hasError = false;

  $: if (name) hasError = false;

  function hideUnavailableArt() {
    hasError = true;
  }
</script>

<div class="card-art" role="img" aria-label={`${name} card art`}>
  <div class="art-placeholder" aria-hidden="true">
    <span>{name.slice(0, 1) || "?"}</span>
    <small>ART COMING SOON</small>
  </div>
  <img
    src={`/GameImages/cardImages/${encodeURIComponent(name)}.jpg`}
    alt=""
    aria-hidden="true"
    hidden={hasError}
    on:error={hideUnavailableArt}
  />
</div>

<style>
  .card-art {
    position: relative;
    overflow: hidden;
    width: 100%;
    aspect-ratio: 3 / 4;
    background: #1e1a29;
  }

  .card-art img,
  .art-placeholder {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .card-art img {
    object-fit: cover;
    image-rendering: pixelated;
  }

  .art-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    box-sizing: border-box;
    padding: 12px;
    background:
      linear-gradient(135deg, rgb(255 209 102 / 9%), transparent 58%),
      #1e1a29;
    color: #a099b5;
    text-align: center;
  }

  .art-placeholder span {
    color: #ffd166;
    font-size: clamp(24px, 5vw, 42px);
  }

  .art-placeholder small {
    font-size: 7px;
    line-height: 1.8;
  }
</style>
