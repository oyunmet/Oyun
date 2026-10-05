import VehicleSprite from "../../saraya-vehicle-extract/VehicleSprite";
import { VEHICLES, VEHICLE_MODELS } from "../../../game/vehicles-extracted";
import type { VehicleId } from "../../../storage/profile";
import "./_group.css";

const DEFAULT_MODELS = VEHICLES.map((vehicle) => ({
  vehicle,
  model: VEHICLE_MODELS.find((candidate) => candidate.vehicle === vehicle.id && candidate.price === 0)!,
}));

const COLORS: Record<VehicleId, string> = {
  bike: "#d8c28f",
  motorcycle: "#e8e0cf",
  car: "#e8e0cf",
};

export function VehicleCurrent() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px clamp(18px, 4vw, 52px)",
        color: "#f4ead5",
        background: "radial-gradient(ellipse at 50% -10%, #29404b 0%, #142530 58%, #101d27 100%)",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <header style={{ maxWidth: 1320, margin: "0 auto 28px" }}>
        <p style={{ margin: 0, color: "#d9bb7c", fontSize: 11, fontWeight: 800, letterSpacing: ".2em" }}>
          SARAYA YOLCULUK · MEVCUT 2D ÇİZİMLER
        </p>
        <h1 style={{ margin: "8px 0 7px", fontSize: "clamp(26px, 4vw, 42px)", letterSpacing: "-.04em" }}>
          Üç araç, aynı çizim dili
        </h1>
        <p style={{ maxWidth: 580, margin: 0, color: "#aeb9b4", fontSize: 14, lineHeight: 1.55 }}>
          Bu karşılaştırma, uygulamadaki gerçek araç SVG&apos;lerini ve sürücü görsellerini kullanır.
        </p>
      </header>
      <section
        aria-label="Mevcut araç çizimleri"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 15,
          maxWidth: 1320,
          margin: "0 auto",
        }}
      >
        {DEFAULT_MODELS.map(({ vehicle, model }) => (
          <article
            key={vehicle.id}
            style={{
              overflow: "hidden",
              border: "1px solid rgba(222, 205, 170, .18)",
              borderRadius: 16,
              background: "linear-gradient(145deg, rgba(40, 58, 66, .95), rgba(24, 40, 49, .96))",
              boxShadow: "0 20px 44px rgba(3, 11, 16, .2), inset 0 1px rgba(255,255,255,.045)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "19px 20px 0" }}>
              <div>
                <p style={{ margin: 0, color: "#cdb578", fontSize: 10, fontWeight: 800, letterSpacing: ".16em" }}>
                  MEVCUT MODEL
                </p>
                <h2 style={{ margin: "5px 0 0", fontSize: 20, fontWeight: 700 }}>{vehicle.name}</h2>
              </div>
              <span style={{ color: "#aeb8b2", fontSize: 11 }}>{model.name}</span>
            </div>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: 220,
                margin: "14px 12px 0",
                overflow: "hidden",
                borderRadius: 12,
                background:
                  "radial-gradient(ellipse at 50% 72%, rgba(202, 174, 117, .15), transparent 48%), linear-gradient(180deg, #263c48 0%, #192c37 100%)",
              }}
            >
              <VehicleSprite
                vehicle={vehicle.id}
                model={model.id}
                character="knight"
                riderColor={COLORS[vehicle.id]}
                width={250}
                height={178}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px 19px" }}>
              <span style={{ color: "#aab5b0", fontSize: 12 }}>{vehicle.description}</span>
              <span style={{ color: "#e8d59f", fontSize: 12, fontWeight: 750 }}>{vehicle.speed} hız</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
