// Forked from https://gist.github.com/marco79cgn/23ce08fd8711ee893a3be12d4543f2d2
// Based on the code at 22 Oct 2020 18:53
//
// Displays the amount of flour that is still available. 
// Product numbers taken from a search for "Weizenmehl": https://www.dm.de/search?query=weizenmehl&searchType=product
//
// Icon made by Freepik from www.flaticon.com and modified by achisto
//
let storeId = 312
let param = args.widgetParameter
if (param != null && param.length > 0) {
    storeId = param
}

const storeCapacity = await fetchAmountOfPaper()
const storeInfo = await fetchStoreInformation()
const widget = new ListWidget()
await createWidget()

// used for debugging if script runs inside the app
if (!config.runsInWidget) {
    await widget.presentSmall()
}
Script.setWidget(widget)
Script.complete()

// build the content of the widget
async function createWidget() {

    widget.addSpacer(4)
    const logoReq = new Request('https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Dm_Logo.svg/300px-Dm_Logo.svg.png')
    const logoImg = await logoReq.loadImage()

    widget.setPadding(10,10,10,10)
    widget.url = "https://www.dm.de/search?query=mehl&searchType=product"

    const titleFontSize = 12
    const detailFontSize = 36
    
    const logoStack = widget.addStack()
    logoStack.addSpacer(90)
    const logoImageStack = logoStack.addStack()
    logoStack.layoutHorizontally()
    logoImageStack.backgroundColor = new Color("#ffffff", 1.0)
    logoImageStack.cornerRadius = 8
    const wimg = logoImageStack.addImage(logoImg)
    wimg.imageSize = new Size(40, 40)
    wimg.rightAlignImage()
    widget.addSpacer()

    const iconReq = new Request('https://i.imgur.com/gwWtMWn.png')
    const icon = await iconReq.loadImage()
    let row = widget.addStack()
    row.layoutHorizontally()
    row.addSpacer(2)
    const iconImg = row.addImage(icon)
    iconImg.imageSize = new Size(40,40)
    row.addSpacer(13)

    let column = row.addStack()
    column.layoutVertically()

    const paperText = column.addText("MEHL")
    paperText.font = Font.mediumRoundedSystemFont(14)

    const packageCount = column.addText(storeCapacity.toString())
    packageCount.font = Font.mediumRoundedSystemFont(22)
    if (storeCapacity < 30) {
        packageCount.textColor = new Color("#E50000")
    } else {
        packageCount.textColor = new Color("#00CD66")
    }
    widget.addSpacer(4)

    const row2 = widget.addStack()
    row2.layoutVertically()

    const street = row2.addText(storeInfo.address.street)
    street.font = Font.regularSystemFont(11)

    const zipCity = row2.addText(storeInfo.address.zip + " " + storeInfo.address.city)
    zipCity.font = Font.regularSystemFont(11)

    let currentTime = new Date().toLocaleTimeString('de-DE', { hour: "numeric", minute: "numeric" })
    let currentDay = new Date().getDay()
    const todaysOpeningHour = storeInfo.openingHours[currentDay].timeRanges[0].opening
    const todaysClosingHour = storeInfo.openingHours[currentDay].timeRanges[0].closing
    const range = [todaysOpeningHour, todaysClosingHour];
    const isOpen = isInRange(currentTime, range)

    let shopStateText
    if (isOpen) {
        shopStateText = row2.addText('Geöffnet')
        shopStateText.textColor = new Color("#00CD66")
    } else {
        shopStateText = row2.addText('Geschlossen')
        shopStateText.textColor = new Color("#E50000")
    }
    shopStateText.font = Font.mediumSystemFont(11)
}

// fetches the amount of toilet paper packages
async function fetchAmountOfPaper() {
    const url = 'https://products.dm.de/store-availability/DE/availability?dans=488334,468120,706590,531500,468121,459912,468178&storeNumbers=' + storeId
    const req = new Request(url)
    const apiResult = await req.loadJSON()
    let counter = 0
    for (var i in apiResult.storeAvailabilities) {
        counter += apiResult.storeAvailabilities[i][0].stockLevel
    }
    return counter
}

// fetches information of the configured store, e.g. opening hours, address etc.
async function fetchStoreInformation() {
    const url = 'https://store-data-service.services.dmtech.com/stores/item/de/' + storeId
    const req = new Request(url)
    const apiResult = await req.loadJSON()
    return apiResult
}

// checks whether the store is currently open or closed
function isInRange(value, range) {
    return value >= range[0] && value <= range[1];
}