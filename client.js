const dnsResolver = "https://dns.google/resolve";

let form;
let ul;
let domainHeading;

const initialize = () => {
  form = document.getElementById("input-form");
  ul = document.getElementById("output-ul");
  domainHeading = document.getElementById("domain-heading");
  const urlDomain = new URLSearchParams(window.location.search).get("domain");
  if (urlDomain && urlDomain.length !== 0) {
    fetchData(urlDomain);
  }
  form.addEventListener("submit", searchInput);
};

const notFoundErrorMsg = () => {
  ul.textContent = "";
  const li = document.createElement("li");
  li.classList.add("spfs");
  li.style.fontSize = "15px";
  li.style.fontFamily = "monospace";
  const p = document.createElement("p");
  p.style.background = "#fefce8";
  p.style.color = "#a16207";
  p.style.width = "100%";
  p.style.padding = "10px 5px";
  const i = document.createElement("i");
  i.classList.add("fas");
  i.style.fontSize = "18px";
  i.innerHTML = "&#xf071;";
  i.style.marginRight = "10px";
  p.appendChild(i);
  p.appendChild(
    document.createTextNode("Couldn't find any SPF record for that domain")
  );
  li.appendChild(p);
  ul.appendChild(li);
};

const fetchData = async (domain) => {
  try {
    domainHeading.textContent = domain;
    const response = await fetch(`${dnsResolver}?name=${domain}&type=TXT`);
    const parseResponse = await response.json();
    if (!parseResponse.Answer) {
      throw Error(`${domain} doesn't have any SPF records.`);
    }
    let spfs = "";
    for (const ele of parseResponse?.Answer) {
      if (ele.data.substring(0, 6) === "v=spf1") {
        spfs = ele.data;
      }
    }
    visualizeData(spfs);
  } catch (error) {
    notFoundErrorMsg();
  }
};

const urlUpdate = (domain) => {
  history.pushState({ domain }, "", `?domain=${domain}`);
  fetchData(domain);
};

window.addEventListener("popstate", (e) => {
  if (e.state && e.state.domain) {
    fetchData(e.state.domain);
  } else {
    domainHeading.textContent = "_";
    ul.textContent = "";
  }
});

const searchInput = async (event) => {
  event.preventDefault();
  const domain = new FormData(event.target).get("domain");
  if (domain) {
    urlUpdate(domain);
  }
};

const visualizeData = (spfs) => {
  const redirect = [];
  const include = [];
  const ip4 = [];
  const ip6 = [];
  let j = 6;
  let substr = "";

  const pushSubstr = (arr) => {
    substr = "";
    while (spfs[j] && spfs[j] !== " ") {
      substr += spfs[j];
      j++;
    }
    arr.push(substr);
    substr = "";
  };

  while (j < spfs.length) {
    if (substr === "ip4:") {
      pushSubstr(ip4);
    } else if (substr === "ip6:") {
      pushSubstr(ip6);
    } else if (substr === "redirect=") {
      pushSubstr(redirect);
    } else if (substr === "include:") {
      pushSubstr(include);
    }
    if (spfs[j] && spfs[j] !== " ") {
      substr += spfs[j];
    }
    j++;
  }
  ul.textContent = "";
  if (!redirect.length && !include.length && !ip4.length && !ip6.length) {
    notFoundErrorMsg();
    return;
  }
  if (redirect.length > 0) {
    redirect.forEach((val) => {
      listNodeAppending(
        { color: "#0891b2", text: "Redirect" },
        { frontText: " SPF checking to " },
        { text: val, color: "#1e40af" },
        `redirect=${val}`
      );
    });
  }
  if (include.length > 0) {
    include.forEach((val) => {
      listNodeAppending(
        { color: "#0891b2", text: "Include" },
        {
          frontText: " the SPF record at ",
          lastText: " and pass if it matches the sender's IP",
        },
        { text: val, color: "#1e40af" },
        `include:${val}`
      );
    });
  }
  if (ip4.length > 0) {
    ip4.forEach((val) => {
      listNodeAppending(
        { color: "#1ca64f", text: "Pass" },
        { frontText: " if the email sender's IP is between " },
        { text: val, color: "#000000ff" },
        `ip4:${val}`
      );
    });
  }
  if (ip6.length > 0) {
    ip6.forEach((val) => {
      listNodeAppending(
        { color: "#1ca64f", text: "Pass" },
        { frontText: " if the email sender's IP is between " },
        { text: val, color: "#000000ff" },
        `ip6:${val}`
      );
    });
  }
  if (spfs.substring(spfs.length - 3, spfs.length) === "all") {
    if (spfs[spfs.length - 4] === "~") {
      listNodeAppending(
        { text: "mark the ", color: "#000000ff" },
        { frontText: "email as " },
        { text: "softfail", color: "#ea580c" },
        "~all"
      );
    } else if (spfs[spfs.length - 4] === "-") {
      listNodeAppending(
        { text: "mark the ", color: "#000000ff" },
        { frontText: "email as " },
        { text: "fail", color: "#dc2626" },
        "-all"
      );
    }
  }
};

const listNodeAppending = (firstSpan, firstP, secondSpan, secondP) => {
  const li = document.createElement("li");
  const p1 = document.createElement("p");
  const span1 = document.createElement("span");
  const span2 = document.createElement("span");
  const p2 = document.createElement("p");
  li.classList.add("spfs");
  li.style.fontSize = "15px";
  li.style.fontFamily = "monospace";
  span1.style.color = firstSpan.color;
  span1.textContent = firstSpan.text;
  ul.childElementCount > 0 &&
    p1.appendChild(document.createTextNode("Or else, "));
  p1.appendChild(span1);
  p1.appendChild(document.createTextNode(` ${firstP.frontText} `));
  if (firstSpan.text === "Redirect" || firstSpan.text === "Include") {
    span2.textContent = secondSpan.text;
    span2.style.color = secondSpan.color;
    span2.style.textDecoration = "underline";
    span2.style.textUnderlineOffset = "3px";
    span2.style.cursor = "pointer";
    span2.addEventListener("click", () => urlUpdate(secondSpan.text));
  } else {
    span2.textContent = secondSpan.text;
    span2.style.color = secondSpan.color;
  }
  p1.appendChild(span2);
  if (firstSpan.text === "Include") {
    p1.appendChild(document.createTextNode(` ${firstP.lastText} `));
  }
  p2.style.color = "rgb(138, 138, 138)";
  p2.style.fontSize = "15px";
  p2.textContent = secondP;
  li.appendChild(p1);
  li.appendChild(p2);
  ul.appendChild(li);
};

document.addEventListener("DOMContentLoaded", initialize);
