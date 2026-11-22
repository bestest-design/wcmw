// Bar menu: single source of truth, rendered into index.html at build time
// (vite.config.mjs -> src/menu.render.mjs). Edit names and prices here.
// Stretched headings ("Driiiinnnksss", "sakeeee") are branding, not typos.
// Stretched titles carry a "plain" name for screen readers, search and the structured data.
// unit "50ml/700ml" or "glass/bottle" adds two price columns; "a/b" prices split into them.

export default {
  "deal": {
    "name": "When Coffee Meets Whisky Deal",
    "desc": "Get any of our Japanese whiskies and get any hot coffee drink for 2 euros"
  },
  "categories": [
    {
      "id": "coffee",
      "label": "Coffee",
      "sections": [
        {
          "title": "Coffee",
          "unit": null,
          "items": [
            {
              "name": "Espresso",
              "price": "2"
            },
            {
              "name": "Double Espresso",
              "price": "3"
            },
            {
              "name": "Americano",
              "price": "3"
            },
            {
              "name": "Espresso Macchiato",
              "price": "2.5"
            },
            {
              "name": "Double Espresso Macchiato",
              "price": "3.5"
            },
            {
              "name": "Cappuccino",
              "price": "3.5"
            },
            {
              "name": "Double Cappuccino",
              "price": "4"
            },
            {
              "name": "Caffe Latte",
              "price": "4.5"
            },
            {
              "name": "Flat White",
              "price": "4"
            },
            {
              "name": "Iced Latte",
              "price": "4.5"
            },
            {
              "name": "Espresso Tonic",
              "price": "5"
            },
            {
              "name": "Moba Ceremonial Matcha",
              "price": "6"
            },
            {
              "name": "Boba Matcha",
              "price": "7"
            },
            {
              "name": "Hot Chocolate",
              "price": "3.5"
            },
            {
              "name": "Tea",
              "price": "3"
            },
            {
              "name": "Tea Pot",
              "price": "5"
            },
            {
              "name": "Moba Ceremonial Matcha (30g)",
              "price": "35"
            }
          ]
        }
      ]
    },
    {
      "id": "whisky",
      "label": "Whisky",
      "sections": [
        {
          "title": "Whisky Menu",
          "unit": "50ml/700ml",
          "items": [
            {
              "name": "Shinobu Blended Whisky",
              "price": "6/45"
            },
            {
              "name": "Mars Kasei Blended Malt",
              "price": "7/50"
            },
            {
              "name": "Toki Suntory",
              "price": "8/55"
            },
            {
              "name": "Kensei Blended Malt",
              "price": "8/55"
            },
            {
              "name": "Nikka from The Barrel Blended Malt 500ml",
              "price": "9/60"
            },
            {
              "name": "Kamiki Blended Malt 500ml",
              "price": "9/65"
            },
            {
              "name": "Nikka Coffey Grain Whisky",
              "price": "10/70"
            },
            {
              "name": "Fujimi Whisky",
              "price": "9/65"
            },
            {
              "name": "Togouchi Beer Cask Finish",
              "price": "10/70"
            },
            {
              "name": "Mars Cosmo",
              "price": "10/70"
            },
            {
              "name": "Ensō Japanese Whisky",
              "price": "12/85"
            },
            {
              "name": "Shinobu Pure Malt",
              "price": "12/85"
            },
            {
              "name": "Kujira 5yo Ryukyu White Oak Virgin Cask",
              "price": "14/95"
            },
            {
              "name": "Kura The Whiskey Blended Malt",
              "price": "14/100"
            },
            {
              "name": "Hibiki Japanese Harmony",
              "price": "15/130"
            },
            {
              "name": "Hibiki Japanese Harmony Masters Select",
              "price": "15/150"
            },
            {
              "name": "The Matsui Single Malt The Peated Cask",
              "price": "17/180"
            },
            {
              "name": "The Matsui Single Malt Mizunara Cask",
              "price": "17/180"
            },
            {
              "name": "The Matsui Single Malt Sakura Cask",
              "price": "17/180"
            }
          ]
        },
        {
          "title": null,
          "unit": null,
          "items": [
            {
              "name": "Old Fashioned or Whisky Sour",
              "price": "11-23",
              "desc": "Ask our bartender for the best selection"
            }
          ]
        }
      ]
    },
    {
      "id": "specials",
      "label": "Specials",
      "sections": [
        {
          "title": "WCMW Specialssssssssssssss",
          "unit": null,
          "items": [
            {
              "name": "When Coffee Meets Negroni",
              "price": "14",
              "desc": "Coffee bean infused negroni (Gin, Vermouth, Campari)"
            }
          ],
          "plain": "WCMW specials"
        }
      ]
    },
    {
      "id": "cocktails",
      "label": "Cocktails",
      "sections": [
        {
          "title": "Signature Cocktailssssssssssssss",
          "unit": null,
          "items": [
            {
              "name": "Liquid Love",
              "price": "15",
              "desc": "Nikka Coffey Vodka, passion, Sakura cherry, lemon, foam, prosecco"
            },
            {
              "name": "Jazz Kissa",
              "price": "14",
              "desc": "Shinobu Whisky, lemon, plum, yuzu, red wine, foam"
            },
            {
              "name": "Inner City Blues",
              "price": "14",
              "desc": "Shinobu Whisky, Kahlua, sugar, espresso, foam"
            },
            {
              "name": "Japanese Yuzu Night",
              "price": "14",
              "desc": "Yuzu gin, lemon, yuzu syrup, yuzu bitters, foam"
            },
            {
              "name": "Yuzu Martini",
              "price": "15",
              "desc": "Floral gin, Yuzu sake, pineapple, sugar"
            },
            {
              "name": "All That's Nice",
              "price": "12",
              "desc": "Spiced Roselle Vietnamese Gin, lemon, ginger"
            },
            {
              "name": "Black Widow",
              "price": "14",
              "desc": "Gin, Creme de Cassis, Kahlua, lime, bitters"
            },
            {
              "name": "Matcha Symphony",
              "price": "14",
              "desc": "Moba matcha, Roku Gin, lemon, sugar, foam"
            },
            {
              "name": "Jalapeno Sour",
              "price": "12",
              "desc": "Shinobu Whisky, jalapeno, lemon, sugar, pineapple juice, foam"
            }
          ],
          "plain": "Signature cocktails"
        }
      ]
    },
    {
      "id": "spirits",
      "label": "Spirits",
      "sections": [
        {
          "title": "Japanese Rum",
          "unit": "50ml/700ml",
          "items": [
            {
              "name": "Minoki Mizunara Cask Finished Rum",
              "price": "8/60"
            },
            {
              "name": "Ryoma Rum",
              "price": "9/70"
            }
          ]
        },
        {
          "title": "Japanese Vodka",
          "unit": "50ml/700ml",
          "items": [
            {
              "name": "Nikka Coffey Vodka",
              "price": "8/55"
            },
            {
              "name": "Ukiyo Japanese Rice Vodka",
              "price": "9/60"
            }
          ]
        },
        {
          "title": "Japanese ginnnnnnnnnnnnnnn",
          "unit": "50ml/700ml",
          "items": [
            {
              "name": "Roku Gin",
              "price": "7/55"
            },
            {
              "name": "Etsu Yuzu Gin",
              "price": "8/60"
            },
            {
              "name": "Nikka Coffey Gin",
              "price": "9/65"
            },
            {
              "name": "Song Cai Spiced Rossel Gin",
              "price": "9/65"
            },
            {
              "name": "Song Cai Dry Gin",
              "price": "9/65"
            },
            {
              "name": "Komasa Gin Sakurajima Komikan",
              "price": "10/70"
            },
            {
              "name": "Sakari Shukugawa Japanese Craft Gin",
              "price": "12/75"
            }
          ],
          "plain": "Japanese gin"
        },
        {
          "title": "Japanese Whisky",
          "unit": "50ml/700ml",
          "items": [
            {
              "name": "Nikka from The Barrel Blended Malt",
              "price": "9/60"
            },
            {
              "name": "Shinobu Pure Malt Mizunara Oak Finish",
              "price": "12/85"
            },
            {
              "name": "Togouchi Beer Cask Finish",
              "price": "10/70"
            },
            {
              "name": "Kujira 5yo Ryukyu White Oak Virgin Cask",
              "price": "14/95"
            },
            {
              "name": "Hibiki Japanese Harmony",
              "price": "15/130"
            },
            {
              "name": "The Matsui Single Malt Japanese Whisky, The Pleated Cask",
              "price": "17/180"
            }
          ]
        },
        {
          "title": "sakeeeeeeeeeeeeeeeeeee",
          "unit": "50ml/720ml",
          "items": [
            {
              "name": "Bijito Sake Nihonshu Junmai",
              "price": "5/35"
            },
            {
              "name": "Bijito Sake Junmai Ginjo",
              "price": "5/35"
            },
            {
              "name": "Ile Four Yuzu Sake",
              "price": "6/35"
            }
          ],
          "plain": "Sake"
        },
        {
          "title": "Shochu",
          "unit": "50ml/700ml",
          "items": [
            {
              "name": "Sanwa iichiko Silhouette Shochu 25%",
              "price": "9/60"
            }
          ]
        },
        {
          "title": "Soju",
          "unit": "350ml",
          "items": [
            {
              "name": "Jinro Soju",
              "price": "10",
              "note": "Options: Grape, Strawberry, Peach, Grapefruit, Plum, Chamisul"
            }
          ]
        }
      ]
    },
    {
      "id": "wine",
      "label": "Wine",
      "sections": [
        {
          "title": "Champagne & Sparkling",
          "unit": "glass/bottle",
          "items": [
            {
              "name": "Pierre Zero Chardonnay Sparkling",
              "price": "4.5/22.5"
            },
            {
              "name": "Montelliana Prosecco Asolo",
              "price": "6/30"
            },
            {
              "name": "Neumeyer Schaefferstein Crémant",
              "price": "8/40"
            },
            {
              "name": "Andre Clouet Grande Reserve Bouzy",
              "price": "-/65"
            },
            {
              "name": "De Saint Gall Blanc de Blanc 1er Cru",
              "price": "-/70"
            },
            {
              "name": "Andre Clouet Rose Brut Bouzy",
              "price": "-/80"
            },
            {
              "name": "Collard-Picard Cuvee Blac de Blancs",
              "price": "-/100"
            },
            {
              "name": "Drappier Blanc de Quatre Blancs",
              "price": "-/150"
            },
            {
              "name": "Grande Sendree 2012",
              "price": "-/160"
            },
            {
              "name": "Collard-Picard Cuvee des Archives",
              "price": "-/350"
            }
          ]
        },
        {
          "title": "White Wine",
          "unit": "glass/bottle",
          "items": [
            {
              "name": "Prapian Estate 3 Volte Pinot Grigio",
              "price": "6/30",
              "sub": "Venezie IGP BIO"
            },
            {
              "name": "Secret Coast Sauvignon",
              "price": "6/30",
              "sub": "Blanc Marlborough"
            },
            {
              "name": "Grace Koshu Kayagatake Yamanashi",
              "price": "7/35"
            }
          ]
        },
        {
          "title": "Red wineeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          "unit": "glass/bottle",
          "items": [
            {
              "name": "Fortant Terroir d'Altitude Malbec",
              "price": "6/30",
              "sub": "Languedoc-Roussillon IGP"
            },
            {
              "name": "Lucarelli Campo Marina Primitivo",
              "price": "6/30",
              "sub": "di Manduria DOC"
            }
          ],
          "plain": "Red wine"
        },
        {
          "title": "Rose Wine",
          "unit": "glass/bottle",
          "items": [
            {
              "name": "Gaia 4-6 H Agiorgitiko Rose",
              "price": "6/30"
            }
          ]
        }
      ]
    },
    {
      "id": "beer",
      "label": "Beer",
      "sections": [
        {
          "title": "Beeeeeeeeeeeeeeeer",
          "unit": null,
          "items": [
            {
              "name": "Asahi 5.2%",
              "price": "6"
            },
            {
              "name": "Sapporo 4.7%",
              "price": "5.5"
            },
            {
              "name": "Kirin Ichiban 5%",
              "price": "5.5"
            }
          ],
          "plain": "Beer"
        }
      ]
    },
    {
      "id": "no-alcohol",
      "label": "No alcohol",
      "sections": [
        {
          "title": "Non Alcoholic Cocktails",
          "unit": null,
          "items": [
            {
              "name": "Homemade Lemonade",
              "price": "7",
              "note": "(Options: Lychee, Sakura, Melon, Yuzu, Passion)"
            },
            {
              "name": "Boba Lemonade (Passion or Yuzu or Mango)",
              "price": "7"
            }
          ]
        },
        {
          "title": "Juices & Soft Drinks",
          "unit": null,
          "items": [
            {
              "name": "Fresh Orange Juice",
              "price": "5"
            },
            {
              "name": "Fresh Grapefruit Juice",
              "price": "5"
            },
            {
              "name": "OnLemon Lemonades",
              "price": "4"
            },
            {
              "name": "Rudys Kombucha",
              "price": "4"
            },
            {
              "name": "Ginger Beer",
              "price": "4"
            },
            {
              "name": "Tonic",
              "price": "3"
            },
            {
              "name": "0.2L Water (Still/Sparkling)",
              "price": "2.5"
            },
            {
              "name": "0.75L Water (Still/Sparkling)",
              "price": "4"
            }
          ]
        }
      ]
    },
    {
      "id": "snacks",
      "label": "Snacks",
      "sections": [
        {
          "title": "Snacks",
          "unit": null,
          "items": [
            {
              "name": "Olives and Popcorn",
              "price": "6"
            },
            {
              "name": "Kalē Crisps",
              "price": "4"
            },
            {
              "name": "Ice Cream \"SALDS\" (250ml)",
              "price": "6",
              "gapBefore": true
            },
            {
              "name": "Ice Cream \"SALDS\" (450ml)",
              "price": "10"
            },
            {
              "name": "Ice Cream \"SALDS\" Sandwich",
              "price": "6"
            },
            {
              "name": "Ice Cream \"SALDS\" ball",
              "price": "2.5"
            }
          ]
        }
      ]
    }
  ]
}
