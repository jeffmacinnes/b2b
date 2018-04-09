"""
Motor/Imagery Task
"""
import os, sys
from os.path import join
import random

from psychopy import visual, core, event, gui, data
import numpy as np

from taskUtils import writeSettings, loadSettings


def drawTrial(trialType):
    """ Draw the specifed file type """

    # write the timestamp for this trial to output file
    writeTrialData(dataFile, trialType)

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


def writeTrialData(dataFile, trialType):
    currentTime = expClock.getTime()
    dataFile.write('{:.3f}\t{}\n'.format(currentTime, trialType))


#### task parameters ----------------------------------
nBlocks = 3
expDir = os.path.abspath(os.path.dirname(__file__))


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
endMsg = visual.TextStim(win, text='All Done!')


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

# print settings to screen
for setting in expInfo.keys():
    print(setting + ': ' + str(expInfo[setting]))
print('Task is playing at {}x normal speed'.format(expInfo['speedFactor']))
speedFactor = float(expInfo['speedFactor'])

#### Create output file ----------------------------------
outputDir = join(expDir, 'data', str(expInfo['subjID']))
if not os.path.isdir(outputDir):
    os.makedirs(outputDir)
dataFile = open(join(outputDir, (str(expInfo['subjID']) + '_' + str(expInfo['run']).zfill(2) + '.tsv')), 'w')
dataFile.write('\t'.join(['timestamp', 'trialType']) + '\n')


#### Show instructions screen  ----------------------------------
instructMsg = visual.TextStim(win, text='Press any key to start')
instructMsg.draw()
win.flip()
event.waitKeys()

# start clock
expClock = core.Clock()


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

# close everything out
dataFile.close()
endMsg.draw()
win.flip()
core.wait(.1)
