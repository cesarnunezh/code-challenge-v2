import React, { useEffect, useState, useMemo  } from "react"

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"

import "leaflet/dist/leaflet.css"

import RAW_COMMUNITY_AREAS from "../../../data/raw/community-areas.geojson"

function YearSelect({ filterVal, setFilterVal }) {
  const startYear = 2026
  const years = [...Array(11).keys()].map((increment) => startYear - increment)

  return (
    <>
      <label htmlFor="yearSelect" className="fs-3">
        Filter by year:
      </label>
      <select
        id="yearSelect"
        className="form-select form-select-lg mb-3"
        value={filterVal}
        onChange={(e) => setFilterVal(Number(e.target.value))}
      >
        {years.map((year) => (
          <option value={year} key={year}>
            {year}
          </option>
        ))}
      </select>
    </>
  )
}

export default function RestaurantPermitMap() {
  const communityAreaColors = ["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"]

  const [currentYearData, setCurrentYearData] = useState([])
  const [year, setYear] = useState(2026)

  const yearlyDataEndpoint = `/map-data/?year=${year}`

  useEffect(() => {
    fetch(yearlyDataEndpoint)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        console.log("API data:", data)
        setCurrentYearData(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error("Error fetching map data:", err)
        setCurrentYearData([])
      })
  }, [yearlyDataEndpoint])

  const areaPermitMap = useMemo(() => {
    const mapped = {}

    if (!Array.isArray(currentYearData)) return mapped

    currentYearData.forEach((item) => {
      if (!item || typeof item !== "object") return

      const keys = Object.keys(item)
      if (keys.length === 0) return

      const areaName = keys[0]
      mapped[areaName] = item[areaName]
    })

    console.log("areaPermitMap:", mapped)
    return mapped
  }, [currentYearData])

  const totalNumPermits = useMemo(() => {
    return Object.values(areaPermitMap).reduce(
      (sum, area) => sum + (area?.num_permits ?? 0),
      0
    )
  }, [areaPermitMap])

  const maxNumPermits = useMemo(() => {
    const permitCounts = Object.values(areaPermitMap).map(
      (area) => area?.num_permits ?? 0
    )
    return permitCounts.length > 0 ? Math.max(...permitCounts) : 0
  }, [areaPermitMap])

  function getColor(percentageOfPermits) {
    if (percentageOfPermits <= 0) return communityAreaColors[0]
    if (percentageOfPermits <= 0.33) return communityAreaColors[1]
    if (percentageOfPermits <= 0.66) return communityAreaColors[2]
    return communityAreaColors[3]
  }

  function setAreaInteraction(feature, layer) {
    console.log("GeoJSON feature:", feature)

    const areaName = feature?.properties?.community ?? "Unknown"
    const areaData = areaPermitMap[areaName]
    const numPermits = areaData?.num_permits ?? 0

    const percentageOfPermits =
      maxNumPermits > 0 ? numPermits / maxNumPermits : 0

    layer.setStyle({
      fillColor: getColor(percentageOfPermits),
      fillOpacity: 0.7,
      color: "#333",
      weight: 1,
    })

    layer.bindPopup(`<strong>${areaName}</strong><br/>Permits: ${numPermits}`)

    layer.on("mouseover", () => layer.openPopup())
    layer.on("mouseout", () => layer.closePopup())
  }
  
  return (
    <>
      <YearSelect filterVal={year} setFilterVal={setYear} />
      <p className="fs-4">Restaurant permits issued this year: {totalNumPermits}</p>
      <p className="fs-4">
        Maximum number of restaurant permits in a single area: {maxNumPermits}
      </p>

      <MapContainer id="restaurant-map" center={[41.88, -87.62]} zoom={10}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
        />
        <GeoJSON
          data={RAW_COMMUNITY_AREAS}
          onEachFeature={setAreaInteraction}
          key={`${year}-${maxNumPermits}-${totalNumPermits}`}
        />
      </MapContainer>
    </>
  )
}