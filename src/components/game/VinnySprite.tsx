"use client";

export function VinnySprite() {
  return (
    <div
      className="vinny-sprite"
      style={{
        position: "absolute",
        top: "-120px",
        left: "35%",
        transform: "translateX(-50%) scale(1.4)",
      }}
    >
      <div className="vinny-bubble">Hey!</div>
      <div className="vinny-body-lg">
        {/* Hair */}
        <div className="v-hair" />
        {/* Head */}
        <div className="v-head">
          {/* Eyes */}
          <div className="v-eyes">
            <div className="v-eye"><div className="v-pupil" /></div>
            <div className="v-eye"><div className="v-pupil" /></div>
          </div>
          {/* Eyebrows */}
          <div className="v-brows">
            <div className="v-brow" />
            <div className="v-brow" />
          </div>
          {/* Cheeks */}
          <div className="v-cheek" style={{ left: 6 }} />
          <div className="v-cheek" style={{ right: 6 }} />
          {/* Nose */}
          <div className="v-nose" />
          {/* Mustache */}
          <div className="v-stache" />
          {/* Mouth */}
          <div className="v-mouth" />
        </div>
        {/* Neck */}
        <div className="v-neck" />
        {/* Shirt collar */}
        <div className="v-collar-l" />
        <div className="v-collar-r" />
        {/* Vest */}
        <div className="v-vest">
          {/* Name tag */}
          <div className="v-nametag">
            <span>VINNY</span>
          </div>
          {/* Vest buttons */}
          <div className="v-btn1" />
          <div className="v-btn2" />
        </div>
        {/* Arms */}
        <div className="v-arm-l" />
        <div className="v-arm-r" />
        {/* Hands */}
        <div className="v-hand-l" />
        <div className="v-hand-r" />
      </div>
    </div>
  );
}
