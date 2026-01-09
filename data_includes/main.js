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
        "To start, we are checking that you can hear the sound. Please use your headphones and press the “Listen” button. You will hear an electronic sound. <br> <br> Once the sound has played, press “Continue” if you have heard it at an appropriate volume.  If you have not heard the sound, check your headphones or your sound volume and reload the page until you can hear the sound."
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
        // Initialize variables
        newVar("audioStart").global().set(0),
        newVar("playRequestTime").global().set(0),
        newVar("RT_yes").global().set("NA"),
        newVar("RT_no").global().set("NA"),
        newVar("ReplayCount").global().set(0), // start with zero replays

        // Play the trial audio
        newAudio("audio", row.AudioFile).center().play(),

        // Record play request time
        getVar("playRequestTime").set(v => Date.now()),

        // Add replay button
        newButton("replay", "Replay Audio").center().print(),

        // Event handler for replay
        getButton("replay").callback(
            getAudio("audio").play(),
            getVar("ReplayCount").set( v => v + 1 ) // add 1 to replay count
        ),

        // Wait for initial audio to start
        getAudio("audio").wait("first"),

        // Set audio start timestamp
        getVar("audioStart").set(v => Date.now()),
        
        newCanvas("spacer", 1, 40) // 40px tall blank space
        .print(),

        // Boxed Yes/No choices
        newCanvas("noBox", 430, 100)
            .css("background-color", "#FBB")
            .css("border", "2px solid red")
            .add(15, 30,
                newText("no", "NOT a Mandarin word")
                    .css("font-size", "40px")
                    .css("font-family", "Avenir")
                    .css("white-space", "nowrap")
                    .color("red")
                    .bold()
            )
            .print(),
        newCanvas("yesBox", 400, 100)
            .css("background-color", "#BFB")
            .css("border", "2px solid green")
            .add(50, 30,
                newText("yes", "A Mandarin word")
                    .css("font-size", "40px")
                    .css("font-family", "Avenir")
                    .css("white-space", "nowrap")
                    .color("green")
                    .bold()
            )
            .print(),

        newCanvas("choiceCanvas", 900, 120)
            .add(-20, 0, getCanvas("noBox"))
            .add(490, 0, getCanvas("yesBox"))
            .center()
            .print(),

        // Selector for boxed choices
        newSelector("choice")
            .add(getCanvas("noBox"), getCanvas("yesBox"))
            .log()
            .wait(),

        // Record RT on selection
        getSelector("choice").test.selected(getCanvas("yesBox"))
            .success(
                getVar("RT_yes").set(v => Date.now() - getVar("audioStart").value),
                getVar("RT_no").set("NA")
            )
            .failure(
                getVar("RT_no").set(v => Date.now() - getVar("audioStart").value),
                getVar("RT_yes").set("NA")
            ),

        // Log RTs and Replay count
        getVar("RT_yes").log(),
        getVar("RT_no").log(),
        getVar("ReplayCount").log()
    )
    .log("Stimulus", row.Stimulus)
    .log("Type", row.Type)
    .log("Block", row.Block)
    .log("Order", row.Order)
    .log("Item", row.Item)
    .log("Subject", getVar("Subject"))
    .log("RT_yes", getVar("RT_yes"))
    .log("RT_no", getVar("RT_no"))
    .log("ReplayCount", getVar("ReplayCount")) // logs number of replays
);
// ----- CLOSING -----
PennController("closing",
    newText("thanks", "<p>Thank you for participating!</p>").print(),
    newButton("Finish", "This is the end of the test").print().wait()
);
// Uncomment to send results automatically:
// PennController.SendResults();
