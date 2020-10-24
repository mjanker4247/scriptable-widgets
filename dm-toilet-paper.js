// Forked from https://gist.github.com/marco79cgn/23ce08fd8711ee893a3be12d4543f2d2
// Based on the code at 22 Oct 2020 18:53
//
// Displays the amount of flour that is still available.
// Product numbers taken from a search for "Weizenmehl": https://www.dm.de/search?query=weizenmehl&searchType=product
//
// Icon made by Freepik from www.flaticon.com and modified by achisto
//
let country = "de"; // replace with 'at' for shops in Austria
let storeId = 1791;
let param = args.widgetParameter;
if (param != null && param.length > 0) {
  storeId = param;
}

const widget = new ListWidget();
const storeInfo = await fetchStoreInformation();
const storeCapacityPaper = await fetchAmountOfPaper();
const storeCapacityFlour = await fetchAmountOfFlour();
await createWidget();

// used for debugging if script runs inside the app
if (!config.runsInWidget) {
  await widget.presentSmall();
}
Script.setWidget(widget);
Script.complete();

// build the content of the widget
async function createWidget() {
  widget.addSpacer(4);
  const logoImg = await getImage("dm-logo.png");

  widget.setPadding(10, 10, 10, 10);
  const titleFontSize = 12;
  const detailFontSize = 36;

  // Logo Stack
  const logoStack = widget.addStack();
  logoStack.addSpacer(86);
  const logoImageStack = logoStack.addStack();
  logoStack.layoutHorizontally();
  logoImageStack.backgroundColor = new Color("#ffffff", 1.0);
  logoImageStack.cornerRadius = 8;
  const wimg = logoImageStack.addImage(logoImg);
  wimg.imageSize = new Size(30, 30);
  wimg.rightAlignImage();
  widget.addSpacer();

  // Paper Stack
  const paperIcon = await getImage("toilet-paper.png");
  let paperRow = widget.addStack();
  paperRow.layoutHorizontally();
  paperRow.addSpacer(2);
  const paperIconImg = paperRow.addImage(paperIcon);
  paperIconImg.imageSize = new Size(24, 24);
  paperRow.addSpacer(13);

  let paperColumn = paperRow.addStack();
  paperColumn.layoutVertically();

  const paperText = paperColumn.addText("KLOPAPIER");
  paperText.font = Font.mediumRoundedSystemFont(10);

  // Get capacity of toilet paper
  const packageCountPaper = paperColumn.addText(storeCapacityPaper.toString());
  packageCountPaper.font = Font.mediumRoundedSystemFont(12);
  if (storeCapacityPaper < 30) {
    packageCountPaper.textColor = new Color("#E50000");
  } else {
    packageCountPaper.textColor = new Color("#00CD66");
  }

  // Flour stack
  const flourIcon = await getImage("flour.png");
  let flourRow = widget.addStack();
  flourRow.layoutHorizontally();
  flourRow.addSpacer(2);
  const flourIconImg = flourRow.addImage(flourIcon);
  flourIconImg.imageSize = new Size(24, 24);
  flourRow.addSpacer(13);

  let flourColumn = flourRow.addStack();
  flourColumn.layoutVertically();

  const flourText = flourColumn.addText("MEHL");
  flourText.font = Font.mediumRoundedSystemFont(10);

  const flourPackageCount = flourColumn.addText(storeCapacityFlour.toString());
  flourPackageCount.font = Font.mediumRoundedSystemFont(12);
  if (storeCapacityFlour < 30) {
    flourPackageCount.textColor = new Color("#E50000");
  } else {
    flourPackageCount.textColor = new Color("#00CD66");
  }
  widget.addSpacer(4);

  // Address stack
  const addressRow = widget.addStack();
  addressRow.layoutVertically();

  const street = addressRow.addText(storeInfo.address.street);
  street.font = Font.regularSystemFont(11);

  const zipCity = addressRow.addText(
    storeInfo.address.zip + " " + storeInfo.address.city
  );
  zipCity.font = Font.regularSystemFont(11);

  let currentTime = new Date().toLocaleTimeString("de-DE", {
    hour: "numeric",
    minute: "numeric",
  });
  let currentDay = new Date().getDay();
  let isOpen;
  if (currentDay > 0) {
    const todaysOpeningHour =
      storeInfo.openingHours[currentDay - 1].timeRanges[0].opening;
    const todaysClosingHour =
      storeInfo.openingHours[currentDay - 1].timeRanges[0].closing;
    const range = [todaysOpeningHour, todaysClosingHour];
    isOpen = isInRange(currentTime, range);
  } else {
    isOpen = false;
  }

  let shopStateText;
  if (isOpen) {
    shopStateText = addressRow.addText("Geöffnet");
    shopStateText.textColor = new Color("#00CD66");
  } else {
    shopStateText = addressRow.addText("Geschlossen");
    shopStateText.textColor = new Color("#E50000");
  }
  shopStateText.font = Font.mediumSystemFont(11);
}

// fetches the amount of flour
async function fetchAmountOfFlour() {
  let url;
  let counter = 0;

  // Germany
  url =
    "https://products.dm.de/store-availability/DE/availability?dans=488334,468120,706590,531500,468121,459912,468178&storeNumbers=" +
    storeId;
  const req = new Request(url);
  const apiResult = await req.loadJSON();
  for (var i in apiResult.storeAvailabilities) {
    counter += apiResult.storeAvailabilities[i][0].stockLevel;
  }
  return counter;
}

// fetches the amount of toilet paper packages
async function fetchAmountOfPaper() {
  let url;
  let counter = 0;
  if (country.toLowerCase() === "at") {
    // Austria
    const array = [
      "156754",
      "180487",
      "194066",
      "188494",
      "194144",
      "273259",
      "170237",
      "232201",
      "170425",
      "283216",
      "205873",
      "205874",
      "249881",
      "184204",
    ];
    for (var i = 0; i < array.length; i++) {
      let currentItem = array[i];
      url =
        "https://products.dm.de/store-availability/AT/products/dans/" +
        currentItem +
        "/stocklevel?storeNumbers=" +
        storeId;
      let req = new Request(url);
      let apiResult = await req.loadJSON();
      if (req.response.statusCode == 200) {
        counter += apiResult.storeAvailability[0].stockLevel;
      }
    }
  } else {
    // Germany
    url =
      "https://products.dm.de/store-availability/DE/availability?dans=595420,708997,137425,28171,485698,799358,863567,452740,610544,846857,709006,452753,879536,452744,485695,853483,594080,504606,593761,525943,842480,535981,127048,524535&storeNumbers=" +
      storeId;
    const req = new Request(url);
    const apiResult = await req.loadJSON();
    for (var i in apiResult.storeAvailabilities) {
      counter += apiResult.storeAvailabilities[i][0].stockLevel;
    }
  }
  return counter;
}

// fetches information of the configured store, e.g. opening hours, address etc.
async function fetchStoreInformation() {
  let url;
  if (country.toLowerCase() === "at") {
    url =
      "https://store-data-service.services.dmtech.com/stores/item/at/" +
      storeId;
    widget.url =
      "https://www.dm.at/search?query=toilettenpapier&searchType=product";
  } else {
    url =
      "https://store-data-service.services.dmtech.com/stores/item/de/" +
      storeId;
    widget.url =
      "https://www.dm.de/search?query=toilettenpapier&searchType=product";
  }
  let req = new Request(url);
  let apiResult = await req.loadJSON();
  return apiResult;
}

// checks whether the store is currently open or closed
function isInRange(value, range) {
  return value >= range[0] && value <= range[1];
}

// get images from local filestore or download them once
async function getImage(image) {
  let fm = FileManager.local();
  let dir = fm.documentsDirectory();
  let path = fm.joinPath(dir, image);
  if (fm.fileExists(path)) {
    return fm.readImage(path);
  } else {
    // download once
    let imageUrl;
    switch (image) {
      case "dm-logo.png":
        imageUrl =
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Dm_Logo.svg/300px-Dm_Logo.svg.png";
        break;
      case "toilet-paper.png":
        imageUrl = "https://i.imgur.com/Uv1qZGV.png";
        break;
      case "flour.png":
        imageUrl = "https://i.imgur.com/gwWtMWn.png";
        break;
      default:
        console.log(`Sorry, couldn't find ${image}.`);
    }
    let iconImage = await loadImage(imageUrl);
    fm.writeImage(path, iconImage);
    return iconImage;
  }
}

// helper function to download an image from a given url
async function loadImage(imgUrl) {
  const req = new Request(imgUrl);
  return await req.loadImage();
}

// end of script

