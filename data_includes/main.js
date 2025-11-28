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
    .label( "preloadExperiment" )

///// CALIBRATION TRIAL (measures audio latency)
PennController("calibration",
    newText("calibInfo",
        "We are calibrating for potential audio latency. Please use your headphones and press the “Start Calibration” button. You will hear some sounds, and once the sound is played, the “Continue” button will appear. You can then click “Continue” to proceed to the next page."
    ).print(),

    newText("spacer", " ")
        .cssContainer({"margin-bottom": "1em"})
        .print(),

    newButton("StartCalibration", "Start Calibration")
        .print()
        .center()
        .wait(),

    // Vars to hold timestamps/latency
    newVar("playRequestTime").settings.global().set(0),
    newVar("audioStartTime").settings.global().set(0),
    newVar("AudioLatency").settings.global().set(0),
               
    // record the time when we request playback (before calling .play())
    getVar("playRequestTime").set(v => Date.now()),

    // Play a short beep; callback sets actual audio start time
     newAudio("calib", "calibration_beep.wav")
        .play(),

     // True audio start time
    getVar("audioStartTime").set(v => Date.now()),

    // Compute latency
    getVar("AudioLatency").set(
        v => getVar("audioStartTime").value - getVar("playRequestTime").value
    ),

    newButton("Continue", "Continue")
        .print()
        .center()
        .wait()
)
.log("AudioLatency", getVar("AudioLatency"));

///// INSTRUCTIONS
PennController("LexTale_instructions",
    newHtml("LexTale_InstructionText", "intro1.html").print(),

    newText("IDlabel", "Subject ID:")
        .center()
        .print(),
        
    newText("spacer", " ")
        .cssContainer({"margin-bottom": "1em"})
        .print(),

    newTextInput("Subject")
        .cssContainer({"margin-bottom": "1em"})
        .center()
        .print()
        .log(),

    newButton("wait", "Start the test")
        .center()
        .print()
        .wait(
            getTextInput("Subject").test.text(/\d$/)
                .success(
                    newVar("Subject")
                        .global()
                        .set(getTextInput("Subject"))
                )
                .failure(
                    newText("You need to enter your participant ID to start the test")
                        .cssContainer({"font-size": "100%", "color": "red"})
                        .center()
                        .print()
                )
        )
)

///// MAIN TRIAL TEMPLATE
Template("practice_2.csv", row =>
    newTrial("LexTale_trials",
        // Initialize timing and subject vars
        newVar("audioStart").global().set(0),
        newVar("playRequestTime").global().set(0),
        newVar("RT_yes").global().set("NA"),
        newVar("RT_no").global().set("NA"),
       
        
        // Show stimulus (could move before audio if you want)
        newText("stimulus", row.Stimulus)
             .css("font-size", "60px")
             .css("font-family", "Avenir")
             .bold()
             .center()
             .print(),
    
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
           .add(0, 150, getText("no"))
           .add(500, 150, getText("yes"))
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
    // Trial-level logging
    .log("Stimulus", row.Stimulus)
    .log("Type", row.Type)
    .log("Block", row.Block)
    .log("Order", row.Order)
    .log("Item", row.Item)
    .log("Subject", getVar("Subject"))
    .log("RT_yes", getVar("RT_yes"))
    .log("RT_no", getVar("RT_no"))
    .log("AudioLatency", getVar("AudioLatency"))
);

///// CLOSING
PennController("closing",
    newText("thanks", "<p>Thank you for participating!</p>")
        .print(),
    newButton("Finish", "This is end of the test")
        .print()
        .wait()
);

// Uncomment to send results automatically:
// PennController.SendResults();
