"""
Motor/Imagery Task
"""
import os, sys
import random

from psychopy import visual, core, event, gui, data
import numpy as np

from taskUtils import writeSettings, loadSettings


def drawTrial(trialType):
    """ Draw the specifed file type """
    # set trial durations
    if trialType == 'rest':
        trialDur = 20
        restStim.draw()
        restMsg.draw()

    elif trialType == 'motor':
        trialDur = 10
        motorStim.draw()
        motorMsg.draw()

    elif trialType == 'imagery':
        trialDur = 10
        imageryStim.draw()
        imageryMsg.draw()

    # flip to screen and wait for full trial period
    win.flip()
    core.wait(trialDur/speedFactor)


#### Key events ----------------------------------
# press 'q' to quit
event.globalKeys.add(key='q', func=core.quit)


#### Setup Window ----------------------------------
win = visual.Window(size=(700,700),
                    color=(-1,-1,-1),
                    units='cm',
                    monitor='testMonitor')

#### Prepare stimuli ----------------------------------
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

#### task parameters ----------------------------------
nBlocks = 3
speedFactor = 5     # 0-1: slow down, 1+: speed up

#### Prompt users for info ----------------------------------
# load previous settings, otherwise prompt for new ones
try:
    expInfo = loadSettings('prevSettings.json')
    # increment the run counter by 1
    expInfo['run'] = expInfo['run'] + 1
except:
    expInfo = {'subjID': 999, 'run': 1, 'speedFactor': 1}
    print('here')
expInfo['dateStr'] = data.getDateStr()

# present dialog
dlg = gui.DlgFromDict(expInfo, title='task settings', fixed=['dataStr'])
if dlg.OK:
    writeSettings('prevSettings.json', expInfo)
else:
    core.quit()


print('Task is playing at {}x normal speed'.format(speedFactor))


#### begin trial loop ----------------------------------
for b in range(nBlocks):

    # randomize Motor/Imagery order
    trialOrder = ['motor', 'imagery']
    random.shuffle(trialOrder)

    # each block will go REST - MOTOR/IMAGE - REST - MOTOR/IMAGE
    for t in trialOrder:
        # rest trial
        drawTrial('rest')

        # draw motor or imagery trial
        drawTrial(t)


endMsg.draw()
win.flip()
core.wait(.1)
