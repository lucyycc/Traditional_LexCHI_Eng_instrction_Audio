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
        "To start, we are checking that you can hear the sound. Please use your headphones and press the “Listen” button. You will hear an electronic sound. <br> Once the sound has played, press “Continue” if you have heard it at an appropriate volume.  If you have not heard the sound, check your headphones or your sound volume and reload the page until you can hear the sound."
    )
    .css("margin-bottom", "20px")
    .center()
    .print(),
    newButton("StartCalibration", "Listen")
        .center()
        .css("margin-bottom", "20px")
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
        .css("margin-bottom", "20px")
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
        // Initialize timing and subject vars
        newVar("audioStart").global().set(0),
        newVar("playRequestTime").global().set(0),
        newVar("RT_yes").global().set("NA"),
        newVar("RT_no").global().set("NA"),
       
      // play the trial audio
        newAudio("audio", row.AudioFile)
            .play(),

        // Choice labels
        newText("no", "NOT a Mandarin word")
            .css("font-size", "40px")
            .css("font-family", "Avenir")
            .css("white-space", "nowrap")   // ✅ prevents wrapping
            .color("red")
            .center()
            .bold(),

        newText("yes", "A Mandarin word")
            .css("font-size", "40px")
            .css("font-family", "Avenir")
            .css("white-space", "nowrap")   // ✅ prevents wrapping
            .color("green")
            .center()
            .bold(),

        // Record play request time
        getVar("playRequestTime").set(v => Date.now()),

        // Layout choices
     
        newCanvas("choiceCanvas", 800, 800)
           .add(-200, 150, getText("no"))
           .add(450, 150, getText("yes"))
           .print(),

        // Selector: wait for response. On response, compute RT relative to actual audio start.
        newSelector("choice")
            .add(getText("no"), getText("yes"))
            .log()
            .wait(),
        getSelector("choice").test.selected(getText("yes"))
            .success(
                getVar("RT_yes").set(v => Date.now() - getVar("audioStart").value),
                getVar("RT_no").set("NA")
            )
            .failure(
                getVar("RT_no").set(v => Date.now() - getVar("audioStart").value),
                getVar("RT_yes").set("NA")
            ),


        // Wait for audio to start
        getAudio("audio").wait("first"),

        // Set actual audio start timestamp
        getVar("audioStart").set(v => Date.now()),
        // Log RT and latency
        getVar("RT_yes").log(),
        getVar("RT_no").log(),
        getVar("AudioLatency").log()  // If you set this somewhere else
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
