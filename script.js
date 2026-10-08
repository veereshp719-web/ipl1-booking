const demoArticles = [
  {
    id: 1,
    cat: "AI",
    title: "The Future of Artificial Intelligence",
    desc: "From assistants to autonomous agents, explore how AI is changing the way we work and create.",
    author: "Alex Morgan",
    date: "Oct 6, 2026",
    time: "7 min read",
    views: "24.8K",
    likes: 1240,
    img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80"
  },

  {
    id: 2,
    cat: "Productivity",
    title: "How to Build Better Habits",
    desc: "A practical framework for creating routines that actually stick without burning yourself out.",
    author: "Sarah Johnson",
    date: "Oct 4, 2026",
    time: "5 min read",
    views: "18.2K",
    likes: 980,
    img: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80"
  },

  {
    id: 3,
    cat: "Programming",
    title: "The Complete Guide to Web Development",
    desc: "A beginner-friendly roadmap from your first HTML tag to building production-ready web apps.",
    author: "David Wilson",
    date: "Oct 2, 2026",
    time: "9 min read",
    views: "31.4K",
    likes: 1680,
    img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
  },

  {
    id: 4,
    cat: "Design",
    title: "Why Minimalism Is Changing Technology",
    desc: "Less clutter, better experiences: the design principles shaping modern digital products.",
    author: "Emma Davis",
    date: "Sep 29, 2026",
    time: "6 min read",
    views: "12.6K",
    likes: 742,
    img: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=900&q=80"
  },

  {
    id: 5,
    cat: "Business",
    title: "How Startups Turn Ideas Into Products",
    desc: "What happens between a rough idea and the first version customers actually love.",
    author: "Daniel Smith",
    date: "Sep 27, 2026",
    time: "8 min read",
    views: "22.1K",
    likes: 1104,
    img: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80"
  },

  {
    id: 6,
    cat: "Technology",
    title: "The Future of Remote Work",
    desc: "How distributed teams are building better cultures, workflows, and products.",
    author: "Olivia Brown",
    date: "Sep 25, 2026",
    time: "6 min read",
    views: "16.7K",
    likes: 856,
    img: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80"
  },

  {
    id: 7,
    cat: "Education",
    title: "How I Learned Java in 30 Days",
    desc: "The study system that helped me go from syntax confusion to building useful projects.",
    author: "David Wilson",
    date: "Sep 23, 2026",
    time: "5 min read",
    views: "14.3K",
    likes: 623,
    img: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80"
  },

  {
    id: 8,
    cat: "Lifestyle",
    title: "10 Productivity Rules That Actually Work",
    desc: "Simple rules for getting meaningful work done while leaving room for real life.",
    author: "Sarah Johnson",
    date: "Sep 20, 2026",
    time: "4 min read",
    views: "19.9K",
    likes: 903,
    img: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=900&q=80"
  }
];

const publishedArticles = (() => {
  try {
    return JSON.parse(localStorage.getItem("blogsphere_published_articles") || "[]");
  } catch {
    return [];
  }
})();

const articles = [...publishedArticles, ...demoArticles];

let pendingPublish = false;
let currentUser = null;

function supabaseReady() {
  return Boolean(window.blogSupabase);
}

async function loadSupabaseArticles() {
  if (!supabaseReady()) return;

  const { data, error } = await window.blogSupabase
    .from("articles")
    .select("id,title,content,category,image_url,views,likes,created_at,author_id,profiles:author_id(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load Supabase articles:", error);
    return;
  }

  const remoteArticles = (data || []).map(a => ({
    id: `supabase-${a.id}`,
    dbId: a.id,
    cat: a.category,
    title: a.title,
    desc: (a.content || "").replace(/\s+/g, " ").slice(0, 150) + ((a.content || "").length > 150 ? "…" : ""),
    author: a.profiles?.full_name || "BlogSphere Writer",
    date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: `${Math.max(1, Math.ceil((a.content || "").split(/\s+/).filter(Boolean).length / 200))} min read`,
    views: String(a.views || 0),
    likes: a.likes || 0,
    img: a.image_url || "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
    content: a.content || ""
  }));

  articles.splice(0, articles.length, ...remoteArticles, ...publishedArticles, ...demoArticles);
  renderArticles(articles.slice(0, 6), document.getElementById("featuredGrid"));
  filterArticles();
}

async function refreshAuthState() {
  if (!supabaseReady()) {
    currentUser = null;
    return;
  }

  const { data } = await window.blogSupabase.auth.getSession();
  currentUser = data?.session?.user || null;
  updateAuthUI();
}

async function getProfileName(user) {
  if (!user || !supabaseReady()) return user?.user_metadata?.full_name || user?.email || "You";
  const { data } = await window.blogSupabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  return data?.full_name || user.user_metadata?.full_name || user.email || "You";
}

function updateAuthUI() {
  const userBtn = document.getElementById("authUserBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (!userBtn || !logoutBtn) return;
  if (currentUser) {
    const name = currentUser.user_metadata?.full_name || currentUser.email || "Logged in";
    userBtn.textContent = name;
    userBtn.style.display = "inline-flex";
    logoutBtn.style.display = "inline-flex";
  } else {
    userBtn.style.display = "none";
    logoutBtn.style.display = "none";
  }
}

async function publishCurrentStory() {
  const titleInput = document.getElementById("editorTitle");
  const bodyInput = document.getElementById("editorBody");
  const title = titleInput.value.trim();
  const body = bodyInput.innerText.trim();
  const category = document.getElementById("editorCategory").value;

  if (!title) {
    toast("Please add a title before publishing.");
    titleInput.focus();
    return;
  }
  if (!body || body === "Start writing your story...") {
    toast("Please write something before publishing.");
    bodyInput.focus();
    return;
  }

  if (!supabaseReady()) {
    toast("Connect BlogSphere to Supabase first. See supabase-config.js.");
    return;
  }

  if (!currentUser) {
    pendingPublish = true;
    openModal("loginModal");
    document.getElementById("authMessage").textContent = "Log in or create an account to publish your story.";
    return;
  }

  const authorName = await getProfileName(currentUser);
  const { data, error } = await window.blogSupabase
    .from("articles")
    .insert({
      title,
      content: body,
      category,
      author_id: currentUser.id,
      image_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"
    })
    .select("id,title,content,category,image_url,views,likes,created_at,author_id,profiles:author_id(full_name)")
    .single();

  if (error) {
    console.error(error);
    toast(error.message || "Could not publish your story.");
    return;
  }

  const published = {
    id: `supabase-${data.id}`,
    dbId: data.id,
    cat: data.category,
    title: data.title,
    desc: body.replace(/\s+/g, " ").slice(0, 150) + (body.length > 150 ? "…" : ""),
    author: data.profiles?.full_name || authorName,
    date: new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: `${Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 200))} min read`,
    views: "0",
    likes: 0,
    img: data.image_url || "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
    content: body
  };

  articles.unshift(published);
  renderArticles(articles.slice(0, 6), document.getElementById("featuredGrid"));
  filterArticles();
  titleInput.value = "";
  bodyInput.innerHTML = "";
  pendingPublish = false;
  document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
  toast(`Published by ${published.author}. Your article is now live in Explore.`);
}

const writers = [
  [
    "Alex Morgan",
    "Technology writer exploring AI and the future.",
    "8.7K",
    "48",
    "gradient"
  ],

  [
    "Sarah Johnson",
    "Productivity enthusiast and lifelong learner.",
    "12.4K",
    "72",
    "pink"
  ],

  [
    "David Wilson",
    "Developer sharing practical coding lessons.",
    "7.9K",
    "36",
    "blue"
  ],

  [
    "Emma Davis",
    "Designer focused on simple digital experiences.",
    "6.3K",
    "41",
    "green"
  ],

  [
    "Daniel Smith",
    "Startup stories, strategy, and building in public.",
    "9.1K",
    "29",
    "purple"
  ],

  [
    "Olivia Brown",
    "Writing about technology, work, and culture.",
    "5.8K",
    "34",
    "orange"
  ]
];


const categories = [
  ["⌘", "Technology", "12.4K"],
  ["✦", "Artificial Intelligence", "8.9K"],
  ["</>", "Programming", "15.2K"],
  ["◈", "Business", "7.6K"],
  ["🚀", "Startups", "6.3K"],
  ["◴", "Productivity", "9.8K"],
  ["♡", "Lifestyle", "11.7K"],
  ["▣", "Education", "8.2K"],
  ["✎", "Design", "5.4K"],
  ["✈", "Travel", "4.8K"],
  ["₹", "Finance", "7.1K"],
  ["◎", "Personal Development", "10.6K"]
];


function avatar(name, cls = "gradient") {

  return `
    <span class="avatar ${cls}">
      ${name.split(" ").map(x => x[0]).join("")}
    </span>
  `;

}


function articleCard(a) {

  return `
    <article
      class="blog-card"
      data-id="${a.id}"
      data-cat="${a.cat}"
    >

      <div class="card-image">

        <img
          src="${a.img}"
          alt="${a.title}"
        >

        <span class="tag">
          ${a.cat}
        </span>

      </div>


      <div class="card-body">

        <h3>
          ${a.title}
        </h3>

        <p>
          ${a.desc}
        </p>


        <div class="author-row">

          ${avatar(a.author)}

          <div>
            <b>${a.author}</b>

            <small>
              ${a.date} · ${a.time}
            </small>
          </div>

        </div>


        <div class="card-bottom">

          <span>
            ♡
            <span class="like-count">
              ${a.likes}
            </span>
          </span>

          <span>
            ↗ ${a.views}
          </span>


          <div>

            <button
              class="small-action like-btn"
              title="Like"
            >
              ♡
            </button>

            <button
              class="small-action bookmark-btn"
              title="Bookmark"
            >
              🔖
            </button>

            <button class="read-btn">
              Read →
            </button>

          </div>

        </div>

      </div>

    </article>
  `;

}


function renderArticles(list, target) {

  target.innerHTML = list
    .map(articleCard)
    .join("");


  target
    .querySelectorAll(".read-btn")
    .forEach(button => {

      button.onclick = () => {

        const id =
          Number(
            button
              .closest(".blog-card")
              .dataset.id
          );

        openBlog(id);

      };

    });


  target
    .querySelectorAll(".like-btn")
    .forEach(button => {

      button.onclick = () =>
        toggleLike(button);

    });


  target
    .querySelectorAll(".bookmark-btn")
    .forEach(button => {

      button.onclick = () =>
        toggleBookmark(button);

    });

}


renderArticles(
  articles.slice(0, 6),
  document.getElementById("featuredGrid")
);


renderArticles(
  articles,
  document.getElementById("exploreGrid")
);


const trending = [
  [
    "01",
    "The Rise of AI Agents",
    "Alex Morgan",
    "7 min",
    "24.8K",
    articles[0].img
  ],

  [
    "02",
    "How I Learned Java in 30 Days",
    "David Wilson",
    "5 min",
    "14.3K",
    articles[6].img
  ],

  [
    "03",
    "Building My First Startup",
    "Daniel Smith",
    "8 min",
    "22.1K",
    articles[4].img
  ],

  [
    "04",
    "10 Productivity Rules That Actually Work",
    "Sarah Johnson",
    "4 min",
    "19.9K",
    articles[7].img
  ],

  [
    "05",
    "The Future of Software Engineering",
    "Olivia Brown",
    "6 min",
    "17.2K",
    articles[5].img
  ]
];


document.getElementById("trendingList").innerHTML =
  trending
    .map(t => {

      return `
        <div class="trend">

          <strong>${t[0]}</strong>

          <img
            src="${t[5]}"
            alt=""
          >

          <div>

            <b>${t[1]}</b>

            <small>
              ${t[2]} · ${t[3]} read
            </small>

          </div>

          <span>
            ${t[4]}
          </span>

        </div>
      `;

    })
    .join("");


document.getElementById("categoryGrid").innerHTML =
  categories
    .map(c => {

      return `
        <button
          class="category-card"
          data-category="${c[1]}"
        >

          <span class="cat-icon">
            ${c[0]}
          </span>

          <b>${c[1]}</b>

          <small>
            ${c[2]} articles
          </small>

          <span class="arrow">
            →
          </span>

        </button>
      `;

    })
    .join("");


document.getElementById("writerGrid").innerHTML =
  writers
    .map(w => {

      return `
        <article class="writer-card">

          ${avatar(w[0], w[4])}

          <h3>
            ${w[0]}
          </h3>

          <p>
            ${w[1]}
          </p>

          <div class="writer-stats">

            <span>
              <b>${w[2]}</b>
              followers
            </span>

            <span>
              <b>${w[3]}</b>
              articles
            </span>

          </div>

          <button class="follow-btn">
            Follow
          </button>

        </article>
      `;

    })
    .join("");


document.getElementById("postTable").innerHTML =
  articles
    .slice(0, 5)
    .map((a, i) => {

      return `
        <tr>

          <td>
            <b>${a.title}</b>
            <small>${a.cat}</small>
          </td>

          <td>

            <span class="status ${
              i === 1
                ? "draft"
                : i === 2
                ? "scheduled"
                : "published"
            }">

              ${
                i === 1
                  ? "Draft"
                  : i === 2
                  ? "Scheduled"
                  : "Published"
              }

            </span>

          </td>

          <td>
            ${a.views}
          </td>

          <td>
            ${a.likes}
          </td>

          <td>
            ${a.date}
          </td>

          <td>

            <button class="table-action">
              Edit
            </button>

            <button class="table-action delete">
              Delete
            </button>

          </td>

        </tr>
      `;

    })
    .join("");


function toast(message) {

  const t =
    document.getElementById("toast");

  t.textContent = message;

  t.classList.add("show");

  setTimeout(() => {

    t.classList.remove("show");

  }, 2500);

}


function openModal(id) {

  document
    .getElementById(id)
    .classList.add("show");

  document.body.classList.add("modal-open");

}


function closeModal(element) {

  element
    .closest(".modal-backdrop")
    .classList.remove("show");

  document.body.classList.remove("modal-open");

}


function toggleLike(button) {

  button.classList.toggle("liked");

  button.textContent =
    button.classList.contains("liked")
      ? "♥"
      : "♡";


  const count =
    button
      .closest(".card-bottom")
      .querySelector(".like-count");


  if (count) {

    count.textContent =
      Number(count.textContent) +
      (
        button.classList.contains("liked")
          ? 1
          : -1
      );

  }


  toast(
    button.classList.contains("liked")
      ? "Article liked"
      : "Like removed"
  );

}


function toggleBookmark(button) {

  button.classList.toggle("saved");

  toast(
    button.classList.contains("saved")
      ? "Article bookmarked"
      : "Bookmark removed"
  );

}


function openBlog(id) {

  const a =
    articles.find(
      x => x.id === id
    );

  if (!a) return;


  document.getElementById("modalImage").src =
    a.img;


  document.getElementById("modalCategory").textContent =
    a.cat;


  document.getElementById("modalTitle").textContent =
    a.title;


  document.getElementById("modalMeta").innerHTML =
    `
      ${avatar(a.author)}

      <span>
        <b>${a.author}</b>
        <br>
        ${a.date} · ${a.time}
      </span>
    `;


  const content = a.content
    ? a.content
        .split(/\n{2,}/)
        .filter(Boolean)
        .map(p => `<p>${p}</p>`)
        .join("")
    : `
      <p>
        Great ideas often begin as simple questions.
        <b>${a.title}</b> explores the changing landscape
        around this topic and what it means for people
        building, learning, and creating today.
      </p>

      <p>
        Technology and culture are moving quickly,
        but the most useful lessons are often surprisingly
        practical. Start small, pay attention to what works,
        and keep improving.
      </p>

      <blockquote>
        “The best stories don't just give you information.
        They change the way you see something.”
      </blockquote>

      <p>
        Whether you are just getting started or already
        have experience, there is always another perspective
        worth exploring.
      </p>
    `;

  document.getElementById("modalContent").innerHTML = content;

  document.getElementById("comments").innerHTML =
    `
      <div class="comment">

        ${avatar("Maya Lee", "pink")}

        <div>

          <b>Maya Lee</b>

          <small>
            2 hours ago
          </small>

          <p>
            This was a really useful perspective.
            Saving this for later!
          </p>

        </div>

      </div>


      <div class="comment">

        ${avatar("Ryan Kim", "blue")}

        <div>

          <b>Ryan Kim</b>

          <small>
            Yesterday
          </small>

          <p>
            Great article. The examples made
            the idea much easier to understand.
          </p>

        </div>

      </div>
    `;


  openModal("blogModal");

}


document
  .querySelectorAll("[data-open-login]")
  .forEach(button => {

    button.onclick =
      () => openModal("loginModal");

  });


document
  .querySelectorAll("[data-open-signup]")
  .forEach(button => {

    button.onclick =
      () => openModal("signupModal");

  });


document
  .querySelectorAll("[data-open-editor]")
  .forEach(button => {

    button.onclick = () => {

      document
        .getElementById("editor")
        .scrollIntoView({
          behavior: "smooth"
        });

    };

  });


document
  .querySelectorAll("[data-close]")
  .forEach(button => {

    button.onclick =
      () => closeModal(button);

  });


document
  .querySelectorAll(".modal-backdrop")
  .forEach(modal => {

    modal.addEventListener(
      "click",
      event => {

        if (event.target === modal) {

          modal.classList.remove("show");

          document.body.classList.remove(
            "modal-open"
          );

        }

      }
    );

  });


document.getElementById("menuBtn").onclick =
  () => {

    document
      .getElementById("navMenu")
      .classList.toggle("open");

  };


document
  .querySelectorAll("#navMenu a")
  .forEach(link => {

    link.onclick = () => {

      document
        .getElementById("navMenu")
        .classList.remove("open");

    };

  });


let activeFilter = "All";


function filterArticles() {

  const q =
    document
      .getElementById("searchInput")
      .value
      .toLowerCase()
      .trim();


  const result =
    articles.filter(a => {

      const categoryMatch =
        activeFilter === "All" ||
        a.cat === activeFilter;

      const searchMatch =
        `${a.title} ${a.cat} ${a.author}`
          .toLowerCase()
          .includes(q);

      return categoryMatch && searchMatch;

    });


  renderArticles(
    result,
    document.getElementById("exploreGrid")
  );


  document
    .getElementById("noResults")
    .classList
    .toggle(
      "hidden",
      result.length > 0
    );

}


document
  .getElementById("searchInput")
  .addEventListener(
    "input",
    filterArticles
  );


document
  .querySelectorAll(".filter")
  .forEach(button => {

    button.onclick = () => {

      document
        .querySelectorAll(".filter")
        .forEach(x =>
          x.classList.remove("active")
        );

      button.classList.add("active");

      activeFilter =
        button.dataset.filter;

      filterArticles();

    };

  });


document
  .querySelectorAll(".category-card")
  .forEach(button => {

    button.onclick = () => {

      document
        .getElementById("explore")
        .scrollIntoView({
          behavior: "smooth"
        });


      const name =
        button.dataset.category;


      const filter =
        [...document.querySelectorAll(".filter")]
          .find(
            x => x.dataset.filter === name
          );


      if (filter) {

        filter.click();

      } else {

        document
          .getElementById("searchInput")
          .value = name;

        filterArticles();

      }

    };

  });


document
  .querySelectorAll(".follow-btn")
  .forEach(button => {

    button.onclick = () => {

      button.classList.toggle(
        "following"
      );

      button.textContent =
        button.classList.contains("following")
          ? "Following"
          : "Follow";


      toast(
        button.classList.contains("following")
          ? "Now following writer"
          : "Unfollowed writer"
      );

    };

  });


document
  .querySelectorAll(".dash-link")
  .forEach(button => {

    button.onclick = () => {

      document
        .querySelectorAll(".dash-link")
        .forEach(x =>
          x.classList.remove("active")
        );

      button.classList.add("active");

      toast(
        `${button.textContent.trim()} selected`
      );

    };

  });


document
  .querySelectorAll(".table-action")
  .forEach(button => {

    button.onclick = () => {

      if (
        button.classList.contains("delete")
      ) {

        button
          .closest("tr")
          .remove();

        toast(
          "Post removed from demo"
        );

      } else {

        toast(
          "Edit mode opened"
        );

      }

    };

  });


document.getElementById("saveDraft").onclick =
  () => toast(
    "Draft saved successfully!"
  );


document.getElementById("publishBtn").onclick = publishCurrentStory;

document.getElementById("previewBtn").onclick =
  () => {

    document.getElementById("previewTitle")
      .textContent =
      document.getElementById("editorTitle")
        .value ||
      "Untitled Story";


    document.getElementById("previewText")
      .textContent =
      document.getElementById("editorBody")
        .innerText ||
      "Your story is empty.";


    openModal("previewModal");

  };


document
  .querySelectorAll("[data-format]")
  .forEach(button => {

    button.onclick = () => {

      document.execCommand(
        button.dataset.format,
        false,
        null
      );

      document
        .getElementById("editorBody")
        .focus();

    };

  });


document
  .getElementById("editorBody")
  .addEventListener(
    "focus",
    function () {

      if (
        this.innerText ===
        "Start writing your story..."
      ) {

        this.innerText = "";

      }

    }
  );


document
  .getElementById("loginForm")
  .onsubmit = async event => {
    event.preventDefault();
    const message = document.getElementById("authMessage");
    message.className = "auth-message";
    message.textContent = "Signing in…";

    if (!supabaseReady()) {
      message.className = "auth-message error";
      message.textContent = "Add your Supabase URL and anon key to supabase-config.js first.";
      return;
    }

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const { data, error } = await window.blogSupabase.auth.signInWithPassword({ email, password });

    if (error) {
      message.className = "auth-message error";
      message.textContent = error.message;
      return;
    }

    currentUser = data.user;
    updateAuthUI();
    closeModal(document.getElementById("loginModal"));
    message.textContent = "";
    toast(`Welcome back, ${currentUser.user_metadata?.full_name || currentUser.email}!`);

    if (pendingPublish) {
      setTimeout(publishCurrentStory, 150);
    }
  };

document
  .getElementById("signupForm")
  .onsubmit = async event => {
    event.preventDefault();
    const message = document.getElementById("signupMessage");
    message.className = "auth-message";

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const username = document.getElementById("signupUsername").value.trim().replace(/^@/, "");
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirmPassword").value;

    if (password !== confirm) {
      message.className = "auth-message error";
      message.textContent = "Passwords do not match.";
      return;
    }

    if (!supabaseReady()) {
      message.className = "auth-message error";
      message.textContent = "Add your Supabase URL and anon key to supabase-config.js first.";
      return;
    }

    message.textContent = "Creating your account…";
    const { data, error } = await window.blogSupabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, username } }
    });

    if (error) {
      message.className = "auth-message error";
      message.textContent = error.message;
      return;
    }

    if (data.session) {
      currentUser = data.user;
      updateAuthUI();
      closeModal(document.getElementById("signupModal"));
      toast(`Account created. Welcome, ${name}!`);
      if (pendingPublish) setTimeout(publishCurrentStory, 150);
    } else {
      closeModal(document.getElementById("signupModal"));
      openModal("loginModal");
      document.getElementById("authMessage").className = "auth-message success";
      document.getElementById("authMessage").textContent = "Account created. Check your email to confirm it, then log in to publish.";
    }
  };

if (supabaseReady()) {
  window.blogSupabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
  });
}

document.getElementById("logoutBtn").onclick = async () => {
  if (supabaseReady()) await window.blogSupabase.auth.signOut();
  currentUser = null;
  updateAuthUI();
  toast("You have been logged out.");
};

refreshAuthState();
loadSupabaseArticles();


document
  .getElementById("newsletterForm")
  .onsubmit = event => {

    event.preventDefault();

    event.target.reset();

    toast(
      "Thanks for subscribing!"
    );

  };


document
  .getElementById("commentForm")
  .onsubmit = event => {

    event.preventDefault();


    const input =
      document.getElementById(
        "commentInput"
      );


    const comment =
      document.createElement("div");


    comment.className =
      "comment";


    comment.innerHTML =
      `
        ${avatar("You", "green")}

        <div>

          <b>You</b>

          <small>
            Just now
          </small>

          <p>
            ${input.value}
          </p>

        </div>
      `;


    document
      .getElementById("comments")
      .prepend(comment);


    input.value = "";

    toast("Comment posted");

  };


document.getElementById("shareBtn").onclick =
  async () => {

    try {

      await navigator.clipboard.writeText(
        location.href
      );

      toast(
        "Article link copied!"
      );

    } catch {

      toast(
        "Share link ready!"
      );

    }

  };


document.getElementById("searchTop").onclick =
  () => {

    document
      .getElementById("explore")
      .scrollIntoView({
        behavior: "smooth"
      });

  };


window.addEventListener(
  "scroll",
  () => {

    document
      .getElementById("topBtn")
      .classList
      .toggle(
        "show",
        scrollY > 500
      );

  }
);


document.getElementById("topBtn").onclick =
  () => {

    scrollTo({
      top: 0,
      behavior: "smooth"
    });

  };