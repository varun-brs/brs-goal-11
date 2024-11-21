const nasa_eonet_endpoint = "https://eonet.gsfc.nasa.gov/api/v3";
const geoCodingUrl = "https://api.mapbox.com/geocoding/v5/mapbox.places";
let event_name = document.getElementById("eventType");
// event_name.addEventListener("change", function () {
//   console.log(this.value);
// });
let event_data;
let markers = [];
let markerList = [];
let geoData = [];
let event_title;

const sourcesList = [
  "AVO",
  "ABFIRE",
  "AU_BOM",
  "BYU_ICE",
  "BCWILDFIRE",
  "CALFIRE",
  "CEMS",
  "EO",
  "FEMA",
  "FloodList",
  "GDACS",
  "GLIDE",
  "InciWeb",
  "IDC",
  "JTWC",
  "MRR",
  "MBFIRE",
  "NASA_ESRS",
  "NASA_DISP",
  "NASA_HURR",
  "NOAA_NHC",
  "NOAA_CPC",
  "PDC",
  "ReliefWeb",
  "SIVolcano",
  "NATICE",
  "UNISYS",
  "USGS_EHP",
  "USGS_CMT",
  "HDDS",
  "DFES_WA",
];
let mapbox_accesstoken =
  "pk.eyJ1IjoicGFyaXNyaSIsImEiOiJja2ppNXpmaHUxNmIwMnpsbzd5YzczM2Q1In0.8VJaqwqZ_zh8qyeAuqWQgw";
mapboxgl.accessToken = mapbox_accesstoken;

let map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  zoom: 1,
  projection: "equirectangular",
});

let event_link = "";

let geojson = {
  type: "FeatureCollection",
};

$(function () {
  $(".datepicker").datepicker({
    changeMonth: true,
    changeYear: true,
    dateFormat: "yy-mm-dd",
    yearRange: "1900:" + new Date().getFullYear(),
  });
});

$(document).ready(function () {
  fetchEvents();
  $.getJSON(nasa_eonet_endpoint + "/categories").done(function (data) {
    $("#eventTitle").html(null);
    event_data = data.categories;
    // $.each(data.categories, function (key, event) {
    //   console.log(event.title);
    //   $("#eventList").append(
    //     `
    //             <li class="event">
    //                 <div class='event-desc'>
    //                 <h3><a href='#' onclick='showLayers("${event.title}", "${event.link}");'>` +
    //       event.title +
    //       `</a></h3>
    //                 <p>House: ${event.description}</p>
    //                 </div>
    //                 <img src="assets/img/categories/${event.id}.png"></img>
    //             </li>
    //         `
    //   );
    // });
  });
});

event_name.addEventListener("change", function () {
  $("#eventList").html(null);

  console.log(event_data);
  let filteredData = event_data.filter((e) => {
    if (e.title === this.value) {
      return e;
    }
  });

  console.log(filteredData[0].title);

  $("#eventList").append(
    `
            <li class="event">
                <div class='event-desc'>
                <h3 class="mt-3"><a href='#' onclick='showLayers("${filteredData[0].title}", "${filteredData[0].link}");'>` +
      filteredData[0].title +
      `</a></h3>
                <p>House: ${filteredData[0].description}</p>
                </div>
                <img class="event-type-img" src="assets/img/categories/${filteredData[0].id}.png"></img>
            </li>
        `
  );
});

function fetchEvents() {
  event_name.value = "";
  $("#eventTitle").html(null);
  $("#eventSelect").show();
  $("#layerSelect").hide();
  $("#map").hide();
  $("#startDate").val(null);
  $("#endDate").val(null);
}

function searchByDate() {
  let startDate = $("#startDate").val();
  let endDate = $("#endDate").val();
  let limit = $("#limit").val();
  showLayers(event_title, event_link, startDate, endDate, limit);
}

function showLayers(title, link, startDate, endDate, limit = 10) {
  $("#header-cont").html(null);
  console.log(event_data);
  if (link) {
    event_link = link;
  }
  if (title) {
    event_title = title;
  }
  $("#eventTitle").html(" > " + event_title);
  let queryParams = { source: sourcesList.join(","), limit: limit };
  geoData = [];
  markers = [];
  if (startDate && endDate) {
    queryParams["start"] = startDate;
  }
  if (endDate) {
    queryParams["end"] = endDate;
  }
  $("#eventSelect").hide();
  $("#layerSelect").show();
  $("#map").show();
  $.getJSON(event_link, queryParams).done(function (linkData) {
    let categoryData = "";
    $.each(linkData?.events || [], function (key, layerItem) {
      var location = layerItem.geometry[0].coordinates;
      geoData.push({
        coordinates: location,
        title: layerItem.title,
        url: layerItem.sources[0].url,
      });
      let asdf = `<dd><a onclick='showMap(${location});'>${layerItem.title}</a></dd>`;
      categoryData += asdf;
    });
    $("#layerList").html("").append(categoryData);
    displayMap();
  });
}

function showMap(lat, lng) {
  let fm = markers.filter(
    (e) =>
      JSON.stringify(e?.geometry?.coordinates) ===
      JSON.stringify(new Array(lat, lng))
  )[0];
  const popup = `<div class='w-100'><h5>${fm["properties"]["message"]}</h5><h6>${fm["properties"]["coordinatesData"]}</h6><a class='a-ellips' target='_blank' href="${fm["properties"]["url"]}">${fm["properties"]["url"]}</a></div>`;
  $.each(map._popups, (i, p) => p.remove());
  new mapboxgl.Popup({ offset: 25 })
    .setLngLat(fm?.geometry?.coordinates)
    .setHTML(popup)
    .addTo(map);
}

async function displayMap() {
  $.each(markerList || [], function (key, markerPt) {
    markerPt.remove();
  });
  $.each(geoData || [], function (key, geoPt) {
    let markerData = {};
    markerData["type"] = "Feature";
    markerData["properties"] = {};
    markerData["properties"]["message"] = geoPt.title;
    markerData["properties"]["url"] = geoPt.url;
    markerData["properties"]["iconSize"] = [60, 60];
    markerData["properties"]["iconHoverSize"] = [70, 70];
    markerData["geometry"] = {};
    markerData["geometry"]["type"] = "Point";
    markerData["geometry"]["coordinates"] = geoPt.coordinates;
    markers.push(markerData);
    geojson["features"] = markers;
    let ml = new mapboxgl.Marker().setLngLat(geoPt.coordinates);
    ml.getElement().addEventListener("click", async function (e) {
      fetch(
        `${geoCodingUrl}/${geoPt.coordinates[0]},${geoPt.coordinates[1]}.json?access_token=${mapbox_accesstoken}`
      )
        .then((response) => response.json())
        .then((data) => {
          let message = geoPt.title;
          let place_name = (markerData["geometry"]["placeNames"] =
            data.features[0]?.place_name || "");
          let url = geoPt.url;
          let popup_html = `<div class='w-90'><h5>${message}</h5><h6>${place_name}</h6><a class='a-ellips' target='_blank' href="${url}">${url}</a></div>`;
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setLngLat(geoPt.coordinates)
            .setHTML(popup_html);
          popup.addTo(map);
        });
    });
    markerList.push(ml.addTo(map));
  });
}
