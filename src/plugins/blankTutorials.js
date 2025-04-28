const tutorialsDB = window.supabase.createClient(
  "https://qbnuudsitfyxyubxecaa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibnV1ZHNpdGZ5eHl1YnhlY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNzQ0OTIsImV4cCI6MjA2MDc1MDQ5Mn0.FLQ_e8STBAZDEqLVmQjeJNlm-JPfxJQL_iW00Gp3VAI"
);

const TUTORIALS_FORUM = ["8", "10", "15", "16"];

function tutorialHeader({ creator, creator_link, difficulty, language, support, shop }) {
  return `
    <div class="tuto_avatar"></div>
    <div class="tuto_info left-rounded">
      <label>Réalisé par</label> <span class="tuto_info-text">
      ${creator_link ? `<a href="${creator_link}" target='_blank' class="creator_link">${creator}</a>` : creator}
      </span>
    </div>
    <div class="tuto_info">
      <label>niveau</label> <span class="tuto_info-text">${difficulty}</span>
    </div>
    <div class="tuto_info">
      <label>Langage utilisé</label> <span class="tuto_info-text">${language}</span>
    </div>
    <div class="tuto_info">
      <label>Support</label> <span class="tuto_info-text">${support}</span>
    </div>

    ${shop ? `<a href="${shop}" class="tuto_info shop"><span class="tuto_info-text">Acheter</span><i class="bi bi-arrow-right-short"></i></a>` : ""}

  `;
}

const TUTORIAL_FORM = document.querySelector("form[name='post']");

const TUTORIAL_CACHE_KEY = "blanket_tutorial_form";
const IS_EXISTING = "blanket_saved_tutorial";

function setFields(form, data) {
  if (!data) return;

  form.creator.value = data.creator || "";
  form.creator_link.value = data.creator_link || "";
  form.shop.value = data.shop || "";
  form.difficulty.value = data.difficulty || "";
  form.language.value = data.language || "";
  form.support.value = data.support || "";
}

async function displayForm(showShop = false) {
  const temp = document.querySelector("template#tutorialsForm");
  const formContainer = document.querySelector("#tutorialFormContainer");

  if (!temp || !formContainer) return;

  // Vider le container s’il contient déjà quelque chose
  formContainer.innerHTML = "";

  const tutorialsFields = document.importNode(temp.content, true);
  formContainer.appendChild(tutorialsFields);

  const shopField = formContainer.querySelector("input[name='shop']");
  if (shopField) {
    shopField.closest(".shop-option").classList.toggle("hidden", !showShop);
  }

  preloadForm();
}

function getFormData(form) {
  const formData = new FormData(form);
  const entries = {};

  for (const [key, value] of formData.entries()) {
    const input = form.querySelector(`[name="${key}"]`);

    if (!input) continue;

    // Si l'input est masqué (dans .shop-option.hidden), on met une valeur vide
    const isHidden = input.closest(".shop-option")?.classList.contains("hidden");
    entries[key] = isHidden ? "" : value;
  }

  entries.title = formData.get("subject");
  entries.type = formData.get("post_icon");

  return entries;
}

async function preloadForm() {
  let data = null;

  const saved = JSON.parse(sessionStorage.getItem(IS_EXISTING));
  const cached = JSON.parse(sessionStorage.getItem(TUTORIAL_CACHE_KEY));

  // Get the tutorial title (wich is the post title)
  const currentTutorial = getFormData(TUTORIAL_FORM).subject.toLowerCase();

  if (!cached && saved) {
    data = saved;
  } else if (cached) {
    data = cached;
  }

  // If there is a cache, it means the user is in a preview mode
  // -> script will set the form data from sessionStorage
  if (cached || saved) {
    try {
      setFields(TUTORIAL_FORM, data);
    } catch (e) {
      console.warn("Form cache corrompu :", e);
      sessionStorage.removeItem(TUTORIAL_CACHE_KEY);
    }
  }
  // If there is ONLY a title, it means the user is editing an existing tutorial
  // -> script will check if the tutorial exists in the database
  else if (currentTutorial) {
    const { data: existing, error: selectError } = await tutorialsDB.from("tutorials").select().eq("title", currentTutorial).maybeSingle();
    if (selectError) throw selectError;

    setFields(TUTORIAL_FORM, existing);
    sessionStorage.setItem(IS_EXISTING, JSON.stringify(existing));
  }

  TUTORIAL_FORM.addEventListener("input", () => {
    const data = getFormData(TUTORIAL_FORM);
    sessionStorage.setItem(TUTORIAL_CACHE_KEY, JSON.stringify(data));
  });
}

function cleanCache() {
  sessionStorage.removeItem(TUTORIAL_CACHE_KEY);
  sessionStorage.removeItem(IS_EXISTING);
}

async function submitForm() {
  const formData = getFormData(TUTORIAL_FORM);

  console.log("Form data:", formData);

  const data = {
    title: formData.subject.toLowerCase(),
    creator: formData.creator,
    creator_link: formData.creator_link,
    difficulty: formData.difficulty,
    language: formData.language,
    support: formData.support,
    type: formData.post_icon,
  };

  if (formData.shop) {
    data.shop = formData.shop;
  } else {
    data.shop = null;
  }

  const existing = JSON.parse(sessionStorage.getItem(IS_EXISTING));

  if (existing) {
    const { error } = await tutorialsDB.from("tutorials").update(data).eq("id", existing.id);
    if (error) {
      console.error("❌ Failed to update tutorial:", error);
    } else {
      console.log("✅ Tutorial updated successfully");
      cleanCache();
    }
  } else {
    const { error } = await tutorialsDB.from("tutorials").insert(data);
    if (error) {
      console.error("❌ Failed to create tutorial:", error);
    } else {
      console.log("✅ Tutorial created successfully");
      cleanCache();
    }
  }
}

function setupTutorialForm() {
  // Check if the page is a edit post page
  const formContainer = document.querySelector("#tutorialFormContainer");
  if (!formContainer) return;

  const typeInput = document.querySelector(".topicType_input");
  const titleInput = document.querySelector(".topicTitle_input");

  const forum = document.querySelector("input[name='f']");

  // Post mode
  const newtopic = document.querySelector("input[name='mode'][value='newtopic']");
  const reply = document.querySelector("input[name='mode'][value='reply']");
  const edit = document.querySelector("input[name='mode'][value='editpost']");
  const emptyTitle = document.querySelector("input[name='subject']").value;

  if (reply || (edit && !emptyTitle)) {
    titleInput.classList.add("hidden");
    return;
  } else if (newtopic && TUTORIALS_FORUM.includes(forum.value)) {
    typeInput.classList.remove("hidden");
  }
  // case where the user is editting the first post
  else if (edit && !forum && emptyTitle) {
    typeInput.classList.remove("hidden");
  }

  const icon0 = document.querySelector("input#post_icon_0");
  const icon1 = document.querySelector("input#post_icon_1");
  const icon2 = document.querySelector("input#post_icon_2");

  if (!icon1 || !icon2) return;

  const renderForm = (showShop) => {
    displayForm(showShop);

    const form = formContainer.childElementCount > 0;
    const postBtn = TUTORIAL_FORM.querySelector("input[name='post']");
    if (form && postBtn) {
      postBtn.addEventListener("click", submitForm);
    }
  };

  if (icon1.checked || icon2.checked) {
    renderForm(icon2.checked); // showShop = true si icône 2
  }

  icon0.addEventListener("click", () => {
    formContainer.innerHTML = "";
  });
  icon1.addEventListener("click", () => renderForm(false));
  icon2.addEventListener("click", () => renderForm(true));
}

export default {
  async init() {
    if (typeof window.supabase === "undefined") {
      console.error("❌ Supabase is not available.");
      return;
    }

    setupTutorialForm();

    // DISPLAY TUTORIAL HEADER ON THE TUTORIAL PAGE
    const isTutorial = document.querySelector(".post_row:has(.tuto)");
    if (!isTutorial) return;

    cleanCache();

    const header = document.querySelector(".tuto-header");
    header.classList.add("loading");
    const tutorialTitle = document.querySelector(".page-title").innerText.toLowerCase();
    try {
      const { data, error } = await tutorialsDB.from("tutorials").select().eq("title", tutorialTitle);
      if (error) throw error;

      sessionStorage.setItem(IS_EXISTING, JSON.stringify(data[0]));

      if (data[0]) {
        header.innerHTML = tutorialHeader(data[0]);
        const post = document.querySelector(".posts-container:has(.tuto)");
        post.parentElement.insertBefore(header, post);

        const avatar = document.querySelector(".post_avatar > *");
        if (!avatar) return;

        header.querySelector(".tuto_avatar").prepend(avatar);
        header.classList.remove("loading");
      }
    } catch (err) {
      console.error("❌ Failed to load tutorialsBD:", err);
    }
  },
};
