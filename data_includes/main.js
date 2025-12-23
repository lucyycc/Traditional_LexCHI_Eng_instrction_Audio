//// Script to implement the LexTALE test (Lemhöfer & Broersma, 2012) in Ibex using PennController ////
/// Author of original text-based English LexTale PCIbex script: Mieke Slim
/// Author of image-based PCIbex script for Mandarin characters and pseudo-characters: Lisa Levinson
/// Author of the PCIbex script for LexCHI: Lucy Chiang
/// Mandarin materials adatped from:
/// Wen, Y., Qiu, Y., Leong, C.X.R. et al. LexCHI: A quick lexical test for estimating language proficiency in Chinese. 
/// Behav Res 56, 2333–2352 (2024). https://doi.org/10.3758/s13428-023-02151-z 


PennController.ResetPrefix(null);

PennController.DebugOff();

// Sequence: calibration first, then instructions, trials, closing
Sequence("calibration", "preloadExperiment", "LexTale_instructions", "LexTale_trials", SendResults(), "closing");

CheckPreloaded( startsWith("LexTale_trials") )
    .label("preloadExperiment");

// ----- CALIBRATION -----
PennController("calibration",
    newText("calibInfo",
        "We are calibrating for potential audio latency. Please use your headphones and press the “Start Calibration” button. You will hear a sound, and after playback, the “Continue” button will appear."
    ).print(),
    newButton("StartCalibration", "Start Calibration")
        .center()
        .print()
        .wait(),
    // record time when request is made, then play audio
    newVar("playRequestTime").global().set(v=>Date.now()),
    newAudio("calib", "calibration_beep.wav")
        .play()
        .wait("first"),
    // After audio has started, grab time
    newVar("audioStartTime").global().set(v=>Date.now()),
    // Compute latency and log
    newVar("AudioLatency").global().set(v => getVar("audioStartTime").value - getVar("playRequestTime").value )
        .log(),
    newButton("Continue", "Continue")
        .center()
        .print()
        .wait()
);

// ----- INSTRUCTIONS -----
PennController("LexTale_instructions",
    newHtml("LexTale_InstructionText", "intro1.html").print(),
    newText("IDlabel", "Subject ID:").center().print(),
    newTextInput("Subject")
        .center()
        .print()
        .log(),
    newButton("wait", "Start the test")
        .center()
        .print()
        .wait(
            getTextInput("Subject").testNot.text("") // Prevent blank; adjust regex for stricter checks
                .success(
                    newVar("Subject")
                        .global()
                        .set( getTextInput("Subject") )
                )
                .failure(
                    newText("You need to enter your participant ID to start the test")
                        .cssContainer({"font-size": "100%", "color": "red"})
                        .center()
                        .print()
                )
        )
);

// ----- MAIN TRIALS -----
Template("stimuli.csv", row =>
    newTrial("LexTale_trials",
        newVar("audioStart").set(0),
        newVar("playRequestTime").set(0),
        newVar("RT_yes").set("NA"),
        newVar("RT_no").set("NA"),

        getVar("playRequestTime").set(v=>Date.now()),

        newAudio("audio", row.AudioFile)
            .play()
            .wait("first"), // Wait until audio actually starts

        getVar("audioStart").set(v=>Date.now()), // Now we know audio has started
        
        // Choices
        newText("no", "NOT a Mandarin word")
            .css("font-size", "40px").css("font-family", "Avenir")
            .color("red").bold(),

        newText("yes", "A Mandarin word")
            .css("font-size", "40px").css("font-family", "Avenir")
            .color("green").bold(),

        newCanvas("choiceCanvas", 800, 600)
            .add(0, 100, getText("no"))
            .add(500, 100, getText("yes"))
            .print(),

        newSelector("choice")
            .add(getText("no"), getText("yes"))
            .log()
            .wait(),
        // RT calculation for response, relative to audio start
        getSelector("choice").test.selected(getText("yes"))
            .success( getVar("RT_yes").set(v=>Date.now()-getVar("audioStart").value) )
            .failure( getVar("RT_no").set(v=>Date.now()-getVar("audioStart").value) ),

        // Logging subject and key vars
        getVar("RT_yes").log(),
        getVar("RT_no").log()
    )
    .log("Stimulus", row.Stimulus)
    .log("Type", row.Type)
    .log("Block", row.Block)
    .log("Order", row.Order)
    .log("Item", row.Item)
    .log("Subject", getVar("Subject"))
    .log("RT_yes", getVar("RT_yes"))
    .log("RT_no", getVar("RT_no"))
);

// ----- CLOSING -----
PennController("closing",
    newText("thanks", "<p>Thank you for participating!</p>").print(),
    newButton("Finish", "This is the end of the test").print().wait()
);
// Uncomment to send results automatically:
// PennController.SendResults();
