import sys
from psychopy import visual, core, event


# press 'q' to quit
event.globalKeys.add(key='q', func=core.quit)

# set up monitor settings
mywin = visual.Window([800, 800], monitor='testMonitor', units="deg")

#create some stimuli
grating = visual.GratingStim(win=mywin, mask="circle", size=3, pos=[-4,0], sf=3)
fixation = visual.GratingStim(win=mywin, size=0.5, pos=[0,0], sf=0, rgb=-1)

#draw the stimuli and update the window
while True:
    grating.setPhase(0.05, '+')  # advance phase by 0.05 of a cycle
    grating.draw()
    fixation.draw()
    mywin.update()



# clean up
mywin.close()
