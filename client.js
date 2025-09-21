const dnsResolver = "https://dns.google/resolve";

let form;

const initialize = () => {
  form = document.getElementById("input-form");
  form.addEventListener("submit", searchSFP);
};

const searchSFP = async (event) => {
  event.preventDefault();
  const domain = new FormData(event.target).get("domain");
  if (domain) {
    try {
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
      console.log(error);
    }
  }
};

const visualizeData = (spfs) => {
  console.log(spfs);

  const redirect = [];
  const include = [];
  const ip = [];
  let i = 0;
  let j = 0;
  while (j < spfs.length) {
    j++;
  }
};

document.addEventListener("DOMContentLoaded", initialize);
