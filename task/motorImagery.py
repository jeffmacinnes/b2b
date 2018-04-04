"""
Motor/Imagery Task
"""
import os, sys
import random

from psychopy import visual, core, event
import numpy as np


def drawTrial(trialType):
    """ Draw the specifed file type """
    if trialType == 'rest':
        restStim.draw()
        restMsg.draw()
    elif trialType == 'motor':
        motorStim.draw()
        motorMsg.draw()
    elif trialType == 'imagery':
        imageryStim.draw()
        imageryMsg.draw()



#### key events
# press 'q' to quit
event.globalKeys.add(key='q', func=core.quit)


#### setup Window
win = visual.Window(size=(700,700),
                    color=(-1,-1,-1),
                    units='cm',
                    monitor='testMonitor')

#### draw stimuli
stimRadius = 4
msgPos = (0,7)

# Motor trials
motorStim = visual.Circle(win, radius=stimRadius, edges=100,
                            lineColor=None, fillColor=(1,1,1))
motorMsg = visual.TextStim(win, text='Squeeze', pos=msgPos)

# Imagery trials
imageryStim = visual.Circle(win, radius=stimRadius, edges=100,
                            lineColor=(1,1,1), lineWidth=500, fillColor=None)
imageryMsg = visual.TextStim(win, text='Imagine', pos=msgPos)

# Rest trials
restStim = visual.Rect(win, width=2*stimRadius, height=2*stimRadius,
                        fillColor=(1,1,1))
restMsg = visual.TextStim(win, text='Rest', pos=msgPos)

# add'l messages
itiMsg = visual.TextStim(win, text='+')
endMsg = visual.TextStim(win, text='All Done!')

#### task parameters
nTrials = 3
ITI = 1
trialDur = 5

#### begin trial loop
for t in range(4):
    # rest trial
    drawTrial('rest')
    win.flip()
    core.wait(trialDur)

    # wait ITI
    itiMsg.draw()
    win.flip()
    core.wait(ITI)

    # randomize Motor/Imagery order
    trialOrder = ['motor', 'imagery']
    random.shuffle(trialOrder)


    # draw next trial
    drawTrial(trialOrder[0])
    win.flip()
    core.wait(trialDur)

    # wait ITI
    itiMsg.draw()
    win.flip()
    core.wait(ITI)

    # draw remaining trial
    drawTrial(trialOrder[1])
    win.flip()
    core.wait(trialDur)

    # wait ITI
    itiMsg.draw()
    win.flip()
    core.wait(ITI)



endMsg.draw()
win.flip()
core.wait(.1)
