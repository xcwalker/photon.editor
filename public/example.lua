AddCSLuaFile()

local VehicleName = "Dodge Ram (LEO) [A&A]"

-- Available Colors
local A = "AMBER"
local R = "RED"
local DR = "D_RED"
local B = "BLUE"
local W = "WHITE"
local CW = "C_WHITE"
local SW = "S_WHITE"

-- Vehicle Colors

local Color1 = "AMBER"
local Color2 = "AMBER"

local EMV = {}

EMV.Siren = 28
EMV.Skin = 0
EMV.Color = Color(56, 56, 56)

EMV.BodyGroups = {
    {0, 0}, -- Body
    {1, 1}, -- Ariels
    {2, 6}, -- Bed
    {3, 0}, -- Nothing
    {4, 0}, -- Bullbar
    {5, 0}, -- Bumpers
    {6, 2}, -- Chromestrip
    {7, 1}, -- Grill
    {8, 1}, -- Mirrors
    {9, 0}, -- Mudguards
    {10, 4}, -- Runningboards
    {11, 0}, -- Roof
    {12, 0}, -- Snorkel
    {13, 1}, -- Skirt
    {14, 0}, -- Tailgate
    {15, 0}, -- Wheelarches
    {16, 1}, -- Wheels
    {17, 0}, -- clamped1
    {18, 0} -- clamped2
}

EMV.Meta = {
    spot = {
        AngleOffset = -90,
        W = 12,
        H = 12,
        Sprite = "sprites/emv/blank",
        Scale = 3,
        VisRadius = 16
    },
    side = {
        AngleOffset = -90,
        W = 12,
        H = 12,
        Sprite = "sprites/emv/blank",
        Scale = 0.5,
        VisRadius = 16
    },
    head_low = {
        AngleOffset = -90,
        W = 12,
        H = 12,
        Sprite = "sprites/emv/blank",
        Scale = 1,
        VisRadius = 16
    },
    head_high = {
        AngleOffset = -90,
        W = 10,
        H = 10,
        Sprite = "sprites/emv/blank",
        Scale = 1.5,
        VisRadius = 16
    },
    brake = {
        AngleOffset = 90,
        W = 6,
        H = 14,
        Sprite = "sprites/emv/blank",
        Scale = 1.5,
        WMult = 1.2
    }
}

EMV.Positions = {
    [1] = {Vector(42.8, 125.25, 44.2), Angle(0, 0, 0), "side"},
    [2] = {Vector(-42.8, 125.25, 44.2), Angle(0, 0, 0), "side"},
    [3] = {Vector(37.5, 128.5, 49.45), Angle(0, 0, 0), "head_low"},
    [4] = {Vector(-37.5, 128.5, 49.45), Angle(0, 0, 0), "head_low"},
    [5] = {Vector(36, 129.5, 44.4), Angle(0, 0, 0), "head_high"},
    [6] = {Vector(-36, 129.5, 44.4), Angle(0, 0, 0), "head_high"},
    [7] = {Vector(42, -118.5, 55), Angle(0, 30, 0), "brake"},
    [8] = {Vector(-42, -118.5, 55), Angle(0, 330, 0), "brake"}
}

EMV.Sections = {
    ["side"] = {
        {{1, SW, 0.05}, {2, SW, 1.2}}, {{2, SW, 0.05}, {1, SW, 1.2}},
        {{1, SW, 1}, {2, SW, 1}}, {{1, SW, 1}, {2, SW, 2}},
        {{2, SW, 1}, {1, SW, 2}}
    },
    ["high beams"] = {
        {{5, SW, 0.05}, {6, SW, 0.6}}, {{6, SW, 0.05}, {5, SW, 0.6}},
        {{5, SW, 1}, {6, SW, 1}}
    },
    ["brakes"] = {
        {{7, R, 2}, {8, R, 3}}, {{8, R, 2}, {7, R, 3}}, {{7, R, 2}, {8, R, 2}}
    }
}

EMV.Patterns = {
    ["side"] = {
        ["wigwag"] = {
            1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2,
            2
        },
        ["wigwag_pursuit"] = {
            4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5, 5,
            5
        },
        ["steady"] = {3}
    },
    ["high beams"] = {
        ["wigwag"] = {
            1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2,
            2
        },
        ["steady"] = {3}
    },
    ["brakes"] = {
        ["wigwag"] = {
            1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2,
            2
        },
        ["steady"] = {3}
    }
}

EMV.Auto = {
    {
        ID = "Whelen Liberty SX",
        Scale = 1,
        Pos = Vector(0, 25, 93),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Code 3 RX2700",
        Scale = 1,
        Pos = Vector(0, 25, 93),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Code 3 Solex",
        Scale = 1,
        Pos = Vector(0, 25, 90.2),
        Ang = Angle(0, 0, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Federal Signal Integrity",
        Scale = 1,
        Pos = Vector(0, 25, 93),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Federal Signal Legend",
        Scale = 1,
        Pos = Vector(0, 25, 93),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Federal Signal Valor",
        Scale = 1,
        Pos = Vector(0, 20, 93),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Federal Signal Vision SLR",
        Scale = 1,
        Pos = Vector(0, 20, 93),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Feniex Avatar",
        Scale = 1,
        Pos = Vector(0, 25, 90),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Whelen Justice",
        Scale = 1,
        Pos = Vector(0, 25, 94.5),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, -- 10
    {
        ID = "Tomar 200S Rear",
        Scale = 1,
        Pos = Vector(0, -17.5, 91.2),
        Ang = Angle(0, 270, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Tomar 200S Rear Cali",
        Scale = 1,
        Pos = Vector(0, -17.5, 91.2),
        Ang = Angle(0, 270, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "TDM Front Interior Lightbar",
        Scale = 1.2,
        Pos = Vector(0, 53.5, 83),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Federal Signal Viper",
        Scale = 1,
        Pos = Vector(0, 80, 70),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Tomar 200S Rear",
        Scale = 1,
        Pos = Vector(0, -26.5, 81),
        Ang = Angle(0, 270, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Tomar 200S Rear Cali",
        Scale = 1,
        Pos = Vector(0, -26.5, 81),
        Ang = Angle(0, 270, 0),
        Color1 = Color1,
        Color2 = Color2
    }, -- Position Markers - Federal Signal MicroPulse
    {
        ID = "Federal Signal MicroPulse",
        Scale = 1,
        Pos = Vector(12.5, 148, 24),
        Ang = Angle(90, 0, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "A"
    }, {
        ID = "Federal Signal MicroPulse",
        Scale = 1,
        Pos = Vector(-11, 148, 24),
        Ang = Angle(90, 0, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "B"
    }, {
        ID = "Federal Signal MicroPulse",
        Scale = 1,
        Pos = Vector(45.7, 128, 34.5),
        Ang = Angle(0, 280, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "B"
    }, {
        ID = "Federal Signal MicroPulse",
        Scale = 1,
        Pos = Vector(-45, 130.5, 34.5),
        Ang = Angle(0, 80, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "A"
    }, -- 20
    {
        ID = "Federal Signal MicroPulse",
        Scale = 1,
        Pos = Vector(45.25, -114, 34.5),
        Ang = Angle(0, 260, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "A"
    }, {
        ID = "Federal Signal MicroPulse",
        Scale = 1,
        Pos = Vector(-46.4, -111, 34.5),
        Ang = Angle(0, 100, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "B"
    }, {
        ID = "Federal Signal MicroPulse",
        Scale = 1,
        Pos = Vector(8.6, -120, 31.5),
        Ang = Angle(65, 180, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "B"
    }, {
        ID = "Federal Signal MicroPulse",
        Scale = 1,
        Pos = Vector(-11, -120, 30.8),
        Ang = Angle(115, 180, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "A"
    }, -- Position Markers - Whelen Ion
    {
        ID = "Whelen Ion",
        Scale = 1,
        Pos = Vector(12.5, 148, 25.3),
        Ang = Angle(90, 0, 0),
        Phase = "A",
        Color1 = "WHITE"
    }, {
        ID = "Whelen Ion",
        Scale = 1,
        Pos = Vector(-11, 148, 25.3),
        Ang = Angle(90, 0, 0),
        Phase = "A",
        Color1 = "WHITE"
    }, {
        ID = "Whelen Ion",
        Scale = 1,
        Pos = Vector(45.7, 128, 33.5),
        Ang = Angle(0, 280, 0),
        Phase = "B",
        Color1 = Color1
    }, {
        ID = "Whelen Ion",
        Scale = 1,
        Pos = Vector(-45, 130.5, 33.5),
        Ang = Angle(0, 80, 0),
        Phase = "B",
        Color1 = Color1
    }, {
        ID = "Whelen Ion",
        Scale = 1,
        Pos = Vector(45.1, -112.5, 33.5),
        Ang = Angle(0, 260, 0),
        Phase = "A",
        Color1 = Color1
    }, {
        ID = "Whelen Ion",
        Scale = 1,
        Pos = Vector(-45.7, -112.5, 33.5),
        Ang = Angle(0, 100, 0),
        Phase = "A",
        Color1 = Color1
    }, -- 30
    {
        ID = "Whelen Ion",
        Scale = 1,
        Pos = Vector(10, -120, 32),
        Ang = Angle(65, 180, 0),
        Phase = "A",
        Color1 = Color1
    }, {
        ID = "Whelen Ion",
        Scale = 1,
        Pos = Vector(-10, -120, 32),
        Ang = Angle(115, 180, 0),
        Phase = "A",
        Color1 = Color1
    }, -- Position Markers - Whelen Ion Split
    {
        ID = "Whelen Ion Split",
        Scale = 1,
        Pos = Vector(12.5, 148, 25.3),
        Ang = Angle(90, 0, 0),
        Color1 = "WHITE",
        Color2 = Color2
    }, {
        ID = "Whelen Ion Split",
        Scale = 1,
        Pos = Vector(-11, 148, 25.3),
        Ang = Angle(90, 0, 0),
        Color1 = "WHITE",
        Color2 = Color2
    }, {
        ID = "Whelen Ion Split",
        Scale = 1,
        Pos = Vector(45.7, 128, 33.5),
        Ang = Angle(0, 280, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Whelen Ion Split",
        Scale = 1,
        Pos = Vector(-45, 130.5, 33.5),
        Ang = Angle(0, 80, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Whelen Ion Split",
        Scale = 1,
        Pos = Vector(45.1, -112.5, 33.5),
        Ang = Angle(0, 260, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Whelen Ion Split",
        Scale = 1,
        Pos = Vector(-45.7, -112.5, 33.5),
        Ang = Angle(0, 100, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Whelen Ion Split",
        Scale = 1,
        Pos = Vector(10, -120, 32),
        Ang = Angle(65, 180, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Whelen Ion Split",
        Scale = 1,
        Pos = Vector(-10, -120, 32),
        Ang = Angle(115, 180, 0),
        Color1 = Color1,
        Color2 = Color2
    }, -- 40
    {
        ID = "Whelen Tracer 5",
        Scale = 1.15,
        Pos = Vector(-43, 22, 22.5),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Whelen Tracer 5",
        Scale = 1.15,
        Pos = Vector(43.2, 22, 22.5),
        Ang = Angle(0, -90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Whelen Dominator 8",
        Scale = 1,
        Pos = Vector(0, 155, 42),
        Ang = Angle(0, 0, 180),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(15, 152, 35),
        Ang = Angle(0, 270, 180),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-15, 152, 35),
        Ang = Angle(0, 270, 180),
        Phase = "B"
    }, -- Bonnet Lights [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(35, 82, 68),
        Ang = Angle(0, 260, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-35, 82, 68),
        Ang = Angle(0, 280, 0)
    }, -- Bed Lights [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(28, -52, 85.3),
        Ang = Angle(-10, 90, 180)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-28, -52, 85.3),
        Ang = Angle(-10, 90, 180)
    }, {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(22.1, 153, 35),
        Ang = Angle(90, 90, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "TRIPLEA"
    }, -- 50
    {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(-21.7, 153, 35),
        Ang = Angle(90, -90, 0),
        Color1 = Color1,
        Color2 = Color2,
        Phase = "TRIPLEB"
    }, {
        ID = "Whelen LINZ6",
        Scale = 1,
        Pos = Vector(-22.5, 153, 35),
        Ang = Angle(90, 90, 0),
        Color1 = Color1,
        Phase = "A"
    }, {
        ID = "Whelen LINZ6",
        Scale = 1,
        Pos = Vector(23, 153, 35),
        Ang = Angle(90, -90, 0),
        Color1 = Color1,
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(15, 152, 35),
        Ang = Angle(0, 270, 180)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-15, 152, 35),
        Ang = Angle(0, 270, 180)
    }, -- Whelen Liberty SX [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 34, 91.75),
        Ang = Angle(-10, 315, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 34, 91.75),
        Ang = Angle(-10, 225, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 15, 92.25),
        Ang = Angle(-10, 45, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 15, 92.25),
        Ang = Angle(-10, 135, 0)
    }, -- Whelen Liberty SX [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 34, 91.75),
        Ang = Angle(-10, 315, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 34, 91.75),
        Ang = Angle(-10, 225, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 15, 92.25),
        Ang = Angle(-10, 45, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 15, 92.25),
        Ang = Angle(-10, 135, 0),
        Phase = "A"
    }, -- Code 3 RX2700 [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31.5, 31, 91.75),
        Ang = Angle(-10, 0, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31.5, 31, 91.75),
        Ang = Angle(-10, 180, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 13, 92.75),
        Ang = Angle(-10, 45, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 13, 92.75),
        Ang = Angle(-10, 135, 0)
    }, -- Code 3 RX2700 [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31.5, 31, 91.75),
        Ang = Angle(-10, 0, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31.5, 31, 91.75),
        Ang = Angle(-10, 180, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 13, 92.75),
        Ang = Angle(-10, 45, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 13, 92.75),
        Ang = Angle(-10, 135, 0),
        Phase = "A"
    }, -- Code 3 Solex [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 34, 91.75),
        Ang = Angle(-10, 315, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 34, 91.75),
        Ang = Angle(-10, 225, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 16, 92.5),
        Ang = Angle(-10, 45, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 16, 92.5),
        Ang = Angle(-10, 135, 0)
    }, -- Code 3 Solex [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 34, 91.75),
        Ang = Angle(-10, 315, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 34, 91.75),
        Ang = Angle(-10, 225, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 16, 92.5),
        Ang = Angle(-10, 45, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 16, 92.5),
        Ang = Angle(-10, 135, 0),
        Phase = "A"
    }, -- Federal Signal Integrity [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 37, 91.5),
        Ang = Angle(-10, 315, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 37, 91.5),
        Ang = Angle(-10, 225, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-30, 16.75, 92.5),
        Ang = Angle(-10, 0, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(30, 16, 92.5),
        Ang = Angle(-10, 180, 0)
    }, -- Federal Signal Integrity [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 37, 91.5),
        Ang = Angle(-10, 315, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 37, 91.5),
        Ang = Angle(-10, 225, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-30, 16.75, 92.5),
        Ang = Angle(-10, 0, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(30, 16, 92.5),
        Ang = Angle(-10, 180, 0),
        Phase = "A"
    }, -- Federal Signal Legend [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-27, 34.5, 92.25),
        Ang = Angle(-10, 315, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(27, 34.5, 92.25),
        Ang = Angle(-10, 225, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-27, 15, 92.75),
        Ang = Angle(-10, 45, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(27, 15, 92.75),
        Ang = Angle(-10, 135, 0)
    }, -- Federal Signal Legend [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-27, 34.5, 92.25),
        Ang = Angle(-10, 315, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(27, 34.5, 92.25),
        Ang = Angle(-10, 225, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-27, 15, 92.75),
        Ang = Angle(-10, 45, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(27, 15, 92.75),
        Ang = Angle(-10, 135, 0),
        Phase = "A"
    }, -- Federal Signal Valor [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 32, 91.5),
        Ang = Angle(-10, 315, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 32, 91.5),
        Ang = Angle(-10, 225, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 3.5, 92.3),
        Ang = Angle(-10, 45, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 3.5, 92.3),
        Ang = Angle(-10, 135, 0)
    }, -- Federal Signal Valor [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 32, 91.5),
        Ang = Angle(-10, 315, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 32, 91.5),
        Ang = Angle(-10, 225, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 3.5, 92.3),
        Ang = Angle(-10, 45, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 3.5, 92.3),
        Ang = Angle(-10, 135, 0),
        Phase = "A"
    }, -- Federal Signal Vision SLR [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 35, 92),
        Ang = Angle(-10, 315, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 35, 92),
        Ang = Angle(-10, 225, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 5, 92.75),
        Ang = Angle(-10, 45, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 5, 92.75),
        Ang = Angle(-10, 135, 0)
    }, -- Federal Signal Vision SLR [FL<ASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 35, 92),
        Ang = Angle(-10, 315, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 35, 92),
        Ang = Angle(-10, 225, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 5, 92.75),
        Ang = Angle(-10, 45, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 5, 92.75),
        Ang = Angle(-10, 135, 0),
        Phase = "A"
    }, -- Federal Signal Vision SLR [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 34, 91.5),
        Ang = Angle(-10, 315, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 34, 91.5),
        Ang = Angle(-10, 225, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 15.5, 92.25),
        Ang = Angle(-10, 45, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 15.5, 92.25),
        Ang = Angle(-10, 135, 0)
    }, -- Federal Signal Vision SLR [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 34, 91.5),
        Ang = Angle(-10, 315, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 34, 91.5),
        Ang = Angle(-10, 225, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-31, 15.5, 92.25),
        Ang = Angle(-10, 45, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(31, 15.5, 92.25),
        Ang = Angle(-10, 135, 0),
        Phase = "A"
    }, -- Whelen Justice [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 32.5, 92),
        Ang = Angle(-10, 315, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 32.5, 92),
        Ang = Angle(-10, 225, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 17, 92.5),
        Ang = Angle(-10, 45, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 17, 92.5),
        Ang = Angle(-10, 135, 0)
    }, -- Whelen Justice [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 32.5, 92),
        Ang = Angle(-10, 315, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 32.5, 92),
        Ang = Angle(-10, 225, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 17, 92.5),
        Ang = Angle(-10, 45, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 17, 92.5),
        Ang = Angle(-10, 135, 0),
        Phase = "A"
    }, -- Bonnet Lights [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(35, 82, 68),
        Ang = Angle(0, 260, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-35, 82, 68),
        Ang = Angle(0, 280, 0),
        Phase = "B"
    }, -- Bed Lights [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(28, -52, 85.3),
        Ang = Angle(-10, 90, 180),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-28, -52, 85.3),
        Ang = Angle(-10, 90, 180),
        Phase = "B"
    }, -- Position Markers - Juluen EdgeSaber LED
    {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(11, 148, 25.3),
        Ang = Angle(90, 180, 0),
        Phase = "B",
        Color1 = "WHITE"
    }, {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(-11, 148, 25.3),
        Ang = Angle(90, 180, 0),
        Phase = "A",
        Color1 = "WHITE"
    }, {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(45.25, 129, 33),
        Ang = Angle(0, 100, 0),
        Phase = "A",
        Color1 = Color1
    }, {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(-45.25, 129, 33),
        Ang = Angle(0, 260, 0),
        Phase = "B",
        Color1 = Color1
    }, {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(45.25, -112.5, 33),
        Ang = Angle(0, 80, 0),
        Phase = "B",
        Color1 = Color1
    }, {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(-45.75, -112.5, 33),
        Ang = Angle(0, 280, 0),
        Phase = "A",
        Color1 = Color1
    }, {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(20, -125.25, 32),
        Ang = Angle(0, 2.5, 0),
        Phase = "A",
        Color1 = Color1
    }, {
        ID = "Juluen EdgeSaber LED",
        Scale = 1,
        Pos = Vector(-21.5, -125.25, 32),
        Ang = Angle(0, 357.5, 0),
        Phase = "B",
        Color1 = Color1
    }, -- Tailgate Lights - Whelen Tracer 5
    {
        ID = "Whelen Tracer 5",
        Scale = 1,
        Pos = Vector(0, -119, 35.9),
        Ang = Angle(0, 180, 0),
        Color1 = Color1,
        Color2 = Color2
    }, -- Lightbars - Whelen Ultra Freedom Mini
    {
        ID = "Whelen Ultra Freedom Mini Alt",
        Scale = 1,
        Pos = Vector(23, -95, 91),
        Ang = Angle(0, 0, 0),
        Color1 = Color1,
        Color2 = Color2
    }, {
        ID = "Whelen Ultra Freedom Mini Alt",
        Scale = 1,
        Pos = Vector(-24, -95, 91),
        Ang = Angle(0, 0, 0),
        Color1 = Color1,
        Color2 = Color2
    }, -- Lightbars - Whelen Ultra Freedom
    {

        ID = "Whelen Ultra Freedom",
        Scale = 1,
        Pos = Vector(0, 25, 95.25),
        Ang = Angle(0, 90, 0),
        Color1 = Color1,
        Color2 = Color2
    }, -- Whelen Ultra Freedom [STDY]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 35, 91.5),
        Ang = Angle(-10, 315, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 37, 91.5),
        Ang = Angle(-10, 225, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 15.5, 92.5),
        Ang = Angle(-10, 45, 0)
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 15.5, 92.5),
        Ang = Angle(-10, 135, 0)
    }, -- Whelen Ultra Freedom [FLASH]
    {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 35, 91.5),
        Ang = Angle(-10, 315, 0),
        Phase = "A"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 37, 91.5),
        Ang = Angle(-10, 225, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(-29, 15.5, 92.5),
        Ang = Angle(-10, 45, 0),
        Phase = "B"
    }, {
        ID = "Soundoff 200L Worklight",
        Scale = 1,
        Pos = Vector(29, 15.5, 92.5),
        Ang = Angle(-10, 135, 0),
        Phase = "A"
    }
}

EMV.Selections = {
    {
        Name = "Lightbar [FRONT]",
        Options = {
            {Name = "None", Auto = {}},
            {Name = "Whelen Liberty SX", Auto = {1}},
            {Name = "Code 3 RX2700", Auto = {2}},
            {Name = "Code 3 Solex", Auto = {3}},
            {Name = "Federal Signal Integrity", Auto = {4}},
            {Name = "Federal Signal Legend", Auto = {5}},
            {Name = "Federal Signal Valor", Auto = {6}},
            {Name = "Federal Signal Vision SLR", Auto = {7}},
            {Name = "Feniex Avatar", Auto = {8}},
            {Name = "Whelen Justice", Auto = {9}},
            {Name = "Whelen Ultra Freedom", Auto = {142}}
        }

    }, {
        Name = "Lightbar [FRONT] Worklights",
        Options = {
            {Name = "None", Auto = {}},
            {Name = "Whelen Liberty SX [STDY]", Auto = {55, 56, 57, 58}},
            {Name = "Whelen Liberty SX [FLASH]", Auto = {59, 60, 61, 62}},
            {Name = "Code 3 RX2700 [STDY]", Auto = {63, 64, 65, 66}},
            {Name = "Code 3 RX2700 [FLASH]", Auto = {67, 68, 69, 70}},
            {Name = "Code 3 Solex [STDY]", Auto = {71, 72, 73, 74}},
            {Name = "Code 3 Solex [FLASH]", Auto = {75, 76, 77, 78}},
            {Name = "Federal Signal Integrity [STDY]", Auto = {79, 80, 81, 82}},
            {Name = "Federal Signal Integrity [FLASH]", Auto = {83, 84, 85, 86}},
            {Name = "Federal Signal Legend [STDY]", Auto = {87, 88, 89, 90}},
            {Name = "Federal Signal Legend [FLASH]", Auto = {91, 92, 93, 94}},
            {Name = "Federal Signal Valor [STDY]", Auto = {95, 96, 97, 98}},
            {Name = "Federal Signal Valor [FLASH]", Auto = {99, 100, 101, 102}},
            {
                Name = "Federal Signal Vision SLR [STDY]",
                Auto = {103, 104, 105, 106}
            },
            {
                Name = "Federal Signal Vision SLR [FLASH]",
                Auto = {107, 108, 109, 110}
            }, {Name = "Feniex Avatar [STDY]", Auto = {111, 112, 113, 114}},
            {Name = "Feniex Avatar [FLASH]", Auto = {115, 116, 117, 118}},
            {Name = "Whelen Justice [STDY]", Auto = {119, 120, 121, 122}},
            {Name = "Whelen Justice [FLASH]", Auto = {123, 124, 125, 126}},
            {Name = "Whelen Ultra Freedom [STDY]", Auto = {143, 144, 145, 146}},
            {Name = "Whelen Ultra Freedom [FLASH]", Auto = {147, 148, 149, 150}}
        }

    }, {
        Name = "Lightbar [REAR]",
        Options = {
            {Name = "None", Auto = {}}, {Name = "Tomar 200S Rear", Auto = {10}},
            {Name = "Tomar 200S Rear Cali", Auto = {11}}
        }

    }, {
        Name = "Interior Lights [FRONT]",
        Options = {
            {Name = "None", Auto = {}},
            {
                Name = "TDM Front Interior Lightbar & Federal Signal Viper",
                Auto = {12, 13}
            }, {Name = "Federal Signal Viper", Auto = {13}},
            {Name = "TDM Front Interior Lightbar", Auto = {12}}
        }
    }, {
        Name = "Interior Lights [REAR]",
        Options = {
            {Name = "None", Auto = {}}, {Name = "Tomar 200S Rear", Auto = {14}},
            {Name = "Tomar 200S Rear Cali", Auto = {15}}
        }
    }, {
        Name = "Position Markers",
        Options = {
            {Name = "None", Auto = {}},
            {
                Name = "Federal Signal MicroPulse",
                Auto = {16, 17, 18, 19, 20, 21, 22, 23}
            },
            {
                Name = "Whelen Ion | Single Color",
                Auto = {24, 25, 26, 27, 28, 29, 30, 31}
            },
            {
                Name = "Whelen Ion | Split",
                Auto = {32, 33, 34, 35, 36, 37, 38, 39}
            }, {
                Name = "Juluen EdgeSaber LED",
                Auto = {131, 132, 133, 134, 135, 136, 137, 138}
            }
        }
    }, {
        Name = "Runningbar Lights",
        Options = {
            {Name = "None", Auto = {}},
            {Name = "Whelen Tracer 5", Auto = {40, 41}}
        }
    }, {
        Name = "Bullbar Lights",
        Options = {
            {Name = "None", Auto = {}},
            {Name = "Whelen Dominator 8", Auto = {42}},
            {Name = "Soundoff 200L Worklight [FLASH]", Auto = {43, 44}},
            {Name = "Soundoff 200L Worklight [STDY]", Auto = {53, 54}},
            {Name = "Juluen EdgeSaber LED", Auto = {49, 50}},
            {Name = "Whelen LINZ6", Auto = {51, 52}}, {
                Name = "Whelen Dominator 8 & Soundoff 200L Worklight [FLASH]",
                Auto = {42, 43, 44}
            }, {
                Name = "Whelen Dominator 8 & Soundoff 200L Worklight [STDY]",
                Auto = {42, 53, 54}
            },
            {
                Name = "Whelen Dominator 8 & Juluen EdgeSaber LED",
                Auto = {42, 49, 50}
            },
            {Name = "Whelen Dominator 8 & Whelen LINZ6", Auto = {42, 51, 52}},
            {
                Name = "Whelen Dominator 8 & Juluen EdgeSaber LED & Soundoff 200L Worklight [FLASH]",
                Auto = {42, 43, 44, 49, 50}
            }, {
                Name = "Whelen Dominator 8 & Juluen EdgeSaber LED & Soundoff 200L Worklight [STDY]",
                Auto = {42, 53, 54, 49, 50}
            }, {
                Name = "Whelen Dominator 8 & Whelen LINZ6 & Soundoff 200L Worklight [FLASH]",
                Auto = {42, 43, 44, 51, 52}
            }, {
                Name = "Whelen Dominator 8 & Whelen LINZ6 & Soundoff 200L Worklight [STDY]",
                Auto = {42, 53, 54, 51, 52}
            }
        }
    }, {
        Name = "Bonnet Lights",
        Options = {
            {Name = "None", Auto = {}},
            {Name = "Soundoff 200L Worklight [STDY]", Auto = {45, 46}},
            {Name = "Soundoff 200L Worklight [FLASH]", Auto = {127, 128}}
        }
    }, {
        Name = "Bed Lights",
        Options = {
            {Name = "None", Auto = {}},
            {Name = "BedF | Soundoff 200L Worklight [STDY]", Auto = {47, 48}},
            {Name = "BedF | Soundoff 200L Worklight [FLASH]", Auto = {129, 130}},
            {
                Name = "BedD / BedE | Whelen Ultra Freedom Mini",
                Auto = {140, 141}
            }
        }
    }, {
        Name = "Bed Tailgate Lights",
        Options = {
            {Name = "None", Auto = {}}, {Name = "Whelen Tracer 5", Auto = {139}}
        }
    }
}

EMV.Sequences = {
    Sequences = {
        {
            Name = "ON SCENE",
            Stage = "M1",
            Components = {["side"] = "wigwag", ["brakes"] = "wigwag"},
            Disconnect = {}
        }, {
            Name = "ENROUTE",
            Stage = "M2",
            Components = {["side"] = "wigwag_pursuit", ["brakes"] = "wigwag"},
            Disconnect = {45, 46, 47, 48}
        }, {
            Name = "PURSUIT",
            Stage = "M3",
            Components = {
                ["side"] = "steady",
                ["high beams"] = "wigwag",
                ["brakes"] = "wigwag"
            },
            Disconnect = {}
        }
    },
    Traffic = {
        {Name = "LEFT", Stage = "L", Components = {}, Disconnect = {}},
        {Name = "DIVERGE", Stage = "D", Components = {}, Disconnect = {}},
        {Name = "RIGHT", Stage = "R", Components = {}, Disconnect = {}}
    },
    Illumination = {
        {
            Name = "SIDE",
            Components = {{1, SW, 1}, {2, SW, 1}},
            Lights = {
                {Vector(-42.8, 125.25, 44.2), Angle(0, 90, -0), "lamp"},
                {Vector(42.8, 125.25, 44.2), Angle(0, 90, -0), "lamp"}
            },
            Disconnect = {}
        }, {
            Name = "SCENE",
            Components = {{1, SW, 1}, {2, SW, 1}, {3, SW, 1}, {4, SW, 1}},
            Lights = {
                {Vector(-42.8, 125.25, 44.2), Angle(0, 90, -0), "lamp"},
                {Vector(42.8, 125.25, 44.2), Angle(0, 90, -0), "lamp"},
                {Vector(-37.5, 128.5, 49.45), Angle(0, 90, -0), "scene_lamp"},
                {Vector(37.5, 128.5, 49.45), Angle(0, 90, -0), "scene_lamp"}
            },
            Disconnect = {}
        }, {
            Name = "TKDN",
            Components = {
                {1, SW, 1}, {2, SW, 1}, {3, SW, 1}, {4, SW, 1}, {5, SW, 1},
                {6, SW, 1}
            },
            Lights = {
                {Vector(-42.8, 125.25, 44.2), Angle(0, 90, -0), "lamp"},
                {Vector(42.8, 125.25, 44.2), Angle(0, 90, -0), "lamp"},
                {Vector(-37.5, 128.5, 49.45), Angle(0, 90, -0), "scene_lamp"},
                {Vector(37.5, 128.5, 49.45), Angle(0, 90, -0), "scene_lamp"},
                {Vector(-36, 129.5, 44.4), Angle(0, 90, -0), "scene_high_lamp"},
                {Vector(36, 129.5, 44.4), Angle(0, 90, -0), "scene_high_lamp"}
            },
            Disconnect = {}
        }
    }
}

EMV.Lamps = {
    ["lamp"] = {
        Color = Color(200, 200, 200, 255),
        Texture = "effects/flashlight001",
        Near = 8,
        FOV = 80,
        Distance = 1300
    },
    ["scene_lamp"] = {
        Color = Color(200, 200, 200, 255),
        Texture = "effects/flashlight001",
        Near = 8,
        FOV = 120,
        Distance = 1500
    },
    ["scene_high_lamp"] = {
        Color = Color(200, 200, 200, 255),
        Texture = "effects/flashlight001",
        Near = 8,
        FOV = 800,
        Distance = 1750
    }
}

local PI = {}

PI.Meta = {
    reverse = {
        AngleOffset = 90,
        W = 7,
        H = 14,
        Sprite = "sprites/emv/blank",
        Scale = 1,
        WMult = 1.2
    },
    head_low = {
        AngleOffset = -90,
        W = 8,
        H = 8,
        Sprite = "sprites/emv/blank",
        Scale = 0.25,
        VisRadius = 16
    },
    side = {
        AngleOffset = 90,
        W = 6,
        H = 14,
        Sprite = "sprites/emv/blank",
        Scale = 1.2,
        WMult = 1.2
    },
    brake = {
        AngleOffset = 90,
        W = 6,
        H = 14,
        Sprite = "sprites/emv/blank",
        Scale = 1,
        WMult = 1.2
    },
    indicator = {
        AngleOffset = -90,
        W = 12,
        H = 10,
        Sprite = "sprites/emv/blank",
        Scale = 1,
        WMult = 1.2
    }
}

PI.Positions = {
    [1] = {Vector(42.8, 125.25, 44.2), Angle(0, 0, 0), "head_low"},
    [2] = {Vector(-42.8, 125.25, 44.2), Angle(0, 0, 0), "head_low"},
    [3] = {Vector(42, -118.5, 43), Angle(0, 0, 0), "reverse"},
    [4] = {Vector(-42, -118.5, 43), Angle(0, 0, 0), "reverse"},
    [5] = {Vector(4.5, -27, 88), Angle(0, 0, 0), "reverse"},
    [6] = {Vector(-4.5, -27, 88), Angle(0, 0, 0), "reverse"},
    [7] = {Vector(42, -118.5, 47.5), Angle(0, 30, 0), "side"},
    [8] = {Vector(-42, -118.5, 47.5), Angle(0, 330, 0), "side"},
    [9] = {Vector(42, -118.5, 55), Angle(0, 30, 0), "brake"},
    [10] = {Vector(-42, -118.5, 55), Angle(0, 330, 0), "brake"},
    [11] = {Vector(0, -27, 88), Angle(0, 0, 0), "brake"},
    [12] = {Vector(43, 126, 49.45), Angle(0, 320, 0), "indicator"},
    [13] = {Vector(-43, 126, 49.45), Angle(0, 40, 0), "indicator"}
}

PI.States = {
    Headlights = {},
    Brakes = {{9, R, 2}, {10, R, 2}, {11, R, 2}},
    Blink_Left = {{8, R, 3}, {13, A, 1}},
    Blink_Right = {{7, R, 3}, {12, A, 1}},
    Reverse = {{3, SW, 1}, {4, SW, 1}, {5, SW, 1}, {6, SW, 1}},
    Running = {{1, SW, 1}, {2, SW, 1}, {7, R, 1}, {8, R, 1}}
}

local V = {
    Name = VehicleName,
    Class = "prop_vehicle_jeep",
    Category = "[XCW] Vehicles",
    Author = "XC Walker",
    Model = "models/LoneWolfie/dodge_ram_1500_outdoorsman.mdl",
    KeyValues = {
        vehiclescript = "scripts/vehicles/LWCars/dodge_ram_1500_outdoorsman.txt"
    },
    IsEMV = true,
    EMV = EMV,
    HasPhoton = true,
    Photon = PI
}

list.Set("Vehicles", "xcw-dodge_ram-leo_aa", V)

if EMVU then EMVU:OverwriteIndex(VehicleName, EMV) end
if Photon then Photon:OverwriteIndex(VehicleName, PI) end
