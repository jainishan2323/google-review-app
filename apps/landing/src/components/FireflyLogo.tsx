"use client";

export function FireflyLogo({ size = 48 }: { size?: number }) {
  return (
    <>
      <style>{`
        @keyframes firefly-glow {
          0%, 100% {
            filter: drop-shadow(0 0 3px #b8ff6e)
                    drop-shadow(0 0 10px #6dff3a)
                    drop-shadow(0 0 22px #39d900);
          }
          45%, 55% {
            filter: drop-shadow(0 0 1px #b8ff6e);
          }
          50% {
            filter: none;
          }
        }

        @keyframes firefly-float {
          0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
          50%       { transform: translateY(-5px) rotate(1.5deg); }
        }

        .firefly-wrap {
          display: inline-block;
          animation: firefly-float 3.5s ease-in-out infinite;
        }

        .firefly-svg {
          animation: firefly-glow 2.8s ease-in-out infinite;
        }
      `}</style>

      <span className="firefly-wrap">
        <svg
          className="firefly-svg"
          width={size}
          height={size}
          viewBox="0 0 512 512"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left antenna */}
          <path d="M 242,112 C 233,85 218,63 206,49" />
          <path d="M 206,49 C 202,43 195,41 191,46 C 188,52 192,60 198,57" />

          {/* Right antenna */}
          <path d="M 270,112 C 279,85 294,63 306,49" />
          <path d="M 306,49 C 310,43 317,41 321,46 C 324,52 320,60 314,57" />

          {/* Head */}
          <circle cx="256" cy="128" r="26" />

          {/* Left wing */}
          <path d="
            M 214,178
            C 200,145 174,112 148,105
            C 112,95 82,118 78,168
            C 74,216 98,280 148,304
            C 174,316 206,306 215,284
            C 223,265 222,208 214,178 Z
          " />

          {/* Right wing */}
          <path d="
            M 298,178
            C 312,145 338,112 364,105
            C 400,95 430,118 434,168
            C 438,216 414,280 364,304
            C 338,316 306,306 297,284
            C 289,265 290,208 298,178 Z
          " />

          {/* Thorax center line */}
          <line x1="256" y1="154" x2="256" y2="352" />

          {/* Abdomen crossbar */}
          <line x1="172" y1="352" x2="340" y2="352" />

          {/* Abdomen U-shape */}
          <path d="M 172,352 C 172,424 212,456 256,454 C 300,456 340,424 340,352" />

          {/* Glow rays */}
          <line x1="196" y1="464" x2="172" y2="493" />
          <line x1="256" y1="468" x2="256" y2="500" />
          <line x1="316" y1="464" x2="340" y2="493" />
        </svg>
      </span>
    </>
  );
}
