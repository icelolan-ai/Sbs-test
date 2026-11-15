/* Editable site settings. Leave a value empty ("") to hide the matching button. */
window.SBS_CONFIG = {
  email: "sales@silverbulletsecurity.com",
  trainingEmail: "training@silverbulletsecurity.com",
  phone: "", // e.g. "+66 2 000 0000" — Call button appears once this is filled in

  // Facebook Messenger link for the chat widget. m.me/<page username or page ID> opens a chat with the page.
  // Page ID taken from the old site's Facebook link; replace with m.me/<username> if the page has one.
  messenger: "https://m.me/100063532233940",

  // Optional external pages for "View program details". Leave empty to open the program details
  // built into this site (content taken from the old /bkk-training and /gxp-training pages).
  links: {
    secureBangkok: "",
    gamp: "",
  },

  offices: [
    { id: "us", address: "2103 Miller Rd, Rosharon, TX 77583" },
    {
      id: "th",
      address:
        "399 Interchange Building, 22nd Floor, Room 2212, Sukhumvit Road, Khlong Toei-Nuea Subdistrict, Watthana District, Bangkok 10110",
    },
    { id: "au", address: "Suite 554, 585 Little Collins St., Melbourne, 3000" },
  ],

  social: [
    { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/silver-bullet-security" },
    { id: "facebook", label: "Facebook", url: "https://www.facebook.com/share/1D5yNmTsyG/?mibextid=wwXIfr" },
    { id: "x", label: "X", url: "https://x.com/bulletsecurity?s=21" },
  ],
};
