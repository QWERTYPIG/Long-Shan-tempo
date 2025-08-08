# Long-Shan tempo Source Code
> This is the source code for the judging system of the second stage in Long-Shan tempo, most popular task in IICC 2025.

I recently learned how to use git and Github and realized I should have used it for version control instead of having multiple similar directories in my computer, so I updated them up here.
## How to use
### server
The server is written in javascript, and running it in a terminal would be enough. It shows some status messages, but feel safe to run it and not check on it frequently.
### opening files
Due to my inability to synchronize the time betweem multiple computers, everything runs on a single computer. Clicking on start.bat opens the directory with all the files, and choose client.html and host.html
To only let the host hear metronome sounds, open them with different browsers and change their audio output.
I personally suggest using two screens, on for host and one for client.
Note that when operating on host, the client won't work, so remember to click on the client page after using the host page to return control.
### client.html
The key mapping should be quite straightforward as shown in the interface, though the guitar may be a little bit confusing. Use 1-8 to choose a chord, them press 0 to strum. There is no need to hold 1-8 whem struming.
### host.html
Start, stop, and reset should be quite straightforward. Note that the score is shown after stop is pressed and disappears after any other button is pressed. 
Replay plays the music played between the most previous start and stop, though pressing reset cleans all data, making replay play nothing.
Sample plays the correct melody for the current bpm at the client.
BPM 60 to 100 sets the current BPM. This affects both the speed used in testing and the speed for sample audio file.
