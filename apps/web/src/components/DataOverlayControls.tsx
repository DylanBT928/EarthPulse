"use client";

import { useState } from "react";

export interface OverlayOptions {
  airQuality: {
    pm25: boolean;
    co2: boolean;
    o3: boolean;
    no2: boolean;
  };
  weather: {
    temperature: boolean;
    humidity: boolean;
    heatwaves: boolean;
  };
  disasters: {
    fires: boolean;
    droughts: boolean;
    severeWeather: boolean;
  };
  environmental: {
    windVectors: boolean;
    pollutionPlumes: boolean;
  };
  optional: {
    seaLevel: boolean;
    glacierMelt: boolean;
    deforestation: boolean;
  };
}

interface DataOverlayControlsProps {
  onOverlayChange: (overlays: OverlayOptions) => void;
}

export default function DataOverlayControls({
  onOverlayChange,
}: DataOverlayControlsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<OverlayOptions>({
    airQuality: { pm25: false, co2: false, o3: false, no2: false },
    weather: { temperature: false, humidity: false, heatwaves: false },
    disasters: { fires: false, droughts: false, severeWeather: false },
    environmental: { windVectors: false, pollutionPlumes: false },
    optional: { seaLevel: false, glacierMelt: false, deforestation: false },
  });

  const updateOverlay = (
    category: keyof OverlayOptions,
    key: string,
    value: boolean,
  ) => {
    const overlayId = `${category}.${key}`;

    // Clear all overlays first
    const clearedOverlays: OverlayOptions = {
      airQuality: { pm25: false, co2: false, o3: false, no2: false },
      weather: { temperature: false, humidity: false, heatwaves: false },
      disasters: { fires: false, droughts: false, severeWeather: false },
      environmental: { windVectors: false, pollutionPlumes: false },
      optional: { seaLevel: false, glacierMelt: false, deforestation: false },
    };

    // If clicking the same overlay, turn it off, otherwise turn on the new one
    const newOverlays =
      value && selectedOverlay !== overlayId
        ? {
            ...clearedOverlays,
            [category]: {
              ...clearedOverlays[category],
              [key]: true,
            },
          }
        : clearedOverlays;

    setSelectedOverlay(
      value && selectedOverlay !== overlayId ? overlayId : null,
    );
    setOverlays(newOverlays);
    onOverlayChange(newOverlays);
  };

  const categories = [
    {
      id: "airQuality",
      name: "Air Quality",
      icon: "🌬️",
      items: [
        {
          key: "pm25",
          label: "PM2.5",
          description: "Particulate Matter < 2.5μm",
        },
        { key: "co2", label: "CO₂", description: "Carbon Dioxide" },
        { key: "o3", label: "O₃", description: "Ozone" },
        { key: "no2", label: "NO₂", description: "Nitrogen Dioxide" },
      ],
    },
    {
      id: "weather",
      name: "Weather & Climate",
      icon: "🌡️",
      items: [
        {
          key: "temperature",
          label: "Temperature",
          description: "Surface temperature",
        },
        {
          key: "humidity",
          label: "Humidity",
          description: "Relative humidity",
        },
        {
          key: "heatwaves",
          label: "Heatwaves",
          description: "Extreme temperature alerts",
        },
      ],
    },
    {
      id: "disasters",
      name: "Natural Disasters",
      icon: "🔥",
      items: [
        {
          key: "fires",
          label: "Forest Fires",
          description: "Active fire locations",
        },
        {
          key: "droughts",
          label: "Droughts",
          description: "Drought conditions",
        },
        {
          key: "severeWeather",
          label: "Severe Weather",
          description: "Storm alerts",
        },
      ],
    },
    {
      id: "environmental",
      name: "Environmental",
      icon: "💨",
      items: [
        {
          key: "windVectors",
          label: "Wind Patterns",
          description: "Wind direction & speed",
        },
        {
          key: "pollutionPlumes",
          label: "Pollution Plumes",
          description: "Pollutant dispersion",
        },
      ],
    },
    {
      id: "optional",
      name: "Climate Change",
      icon: "🌊",
      items: [
        {
          key: "seaLevel",
          label: "Sea Level",
          description: "Sea level changes",
        },
        {
          key: "glacierMelt",
          label: "Glacier Melt",
          description: "Ice coverage changes",
        },
        {
          key: "deforestation",
          label: "Deforestation",
          description: "Forest coverage loss",
        },
      ],
    },
  ];

  return (
    <div className="absolute top-32 left-8 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-white/20">
        {/* Header */}
        <div className="flex items-center space-x-3 p-4 border-b border-white/20">
          <div className="text-lg">📊</div>
          <div>
            <h3 className="text-white font-medium">Data Overlays</h3>
            <p className="text-white/60 text-xs">
              Environmental & Climate Data
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="border-t border-white/20">
          {/* None Option */}
          <div className="border-b border-white/10 p-3">
            <label className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded cursor-pointer">
              <input
                type="radio"
                name="dataOverlay"
                checked={selectedOverlay === null}
                onChange={() => {
                  setSelectedOverlay(null);
                  const clearedOverlays: OverlayOptions = {
                    airQuality: {
                      pm25: false,
                      co2: false,
                      o3: false,
                      no2: false,
                    },
                    weather: {
                      temperature: false,
                      humidity: false,
                      heatwaves: false,
                    },
                    disasters: {
                      fires: false,
                      droughts: false,
                      severeWeather: false,
                    },
                    environmental: {
                      windVectors: false,
                      pollutionPlumes: false,
                    },
                    optional: {
                      seaLevel: false,
                      glacierMelt: false,
                      deforestation: false,
                    },
                  };
                  setOverlays(clearedOverlays);
                  onOverlayChange(clearedOverlays);
                }}
                className="w-4 h-4 text-blue-500 bg-transparent border-2 border-white/40 focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-white text-sm font-medium">🚫 None</div>
                <div className="text-white/50 text-xs">
                  Clear all data overlays
                </div>
              </div>
            </label>
          </div>

          {categories.map((category) => (
            <div
              key={category.id}
              className="border-b border-white/10 last:border-b-0"
            >
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() =>
                  setActiveCategory(
                    activeCategory === category.id ? null : category.id,
                  )
                }
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{category.icon}</span>
                  <span className="text-white text-sm font-medium">
                    {category.name}
                  </span>
                </div>
                <div
                  className={`text-white/40 text-xs transition-transform ${
                    activeCategory === category.id ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </div>
              </div>

              {/* Category Items */}
              {activeCategory === category.id && (
                <div className="bg-black/40 p-2">
                  {category.items.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="dataOverlay"
                        checked={
                          overlays[category.id as keyof OverlayOptions][
                            item.key as keyof (typeof overlays)[keyof OverlayOptions]
                          ]
                        }
                        onChange={(e) =>
                          updateOverlay(
                            category.id as keyof OverlayOptions,
                            item.key,
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 text-blue-500 bg-transparent border-2 border-white/40 focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="text-white text-sm">{item.label}</div>
                        <div className="text-white/50 text-xs">
                          {item.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Data Sources */}
          <div className="p-3 bg-black/40 text-xs text-white/60">
            <div className="mb-1 font-medium">Data Sources:</div>
            <div>OpenAQ • NASA FIRMS • NOAA • Copernicus</div>
          </div>
        </div>
      </div>
    </div>
  );
}
