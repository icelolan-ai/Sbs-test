/* Editable site settings. Leave a value empty ("") to hide the matching button. */
window.SBS_CONFIG = {
  email: "sales@silverbulletsecurity.com",
  trainingEmail: "training@silverbulletsecurity.com",
  phone: "", // e.g. "+66 2 000 0000" — Call button appears once this is filled in

  // Training pages. Empty = the button falls back to emailing the training address.
  links: {
    secureBangkok: "", // was /bkk-training on the old site
    gamp: "",          // was /gxp-training on the old site
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
    { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/silver-bullet-security/" },
    { id: "facebook", label: "Facebook", url: "https://www.facebook.com/people/Silver-Bullet-Security/100063532233940/" },
    { id: "x", label: "X", url: "https://x.com/bulletsecurity" },
  ],
};
