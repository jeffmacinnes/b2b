"""
Motor Imagery Task
"""

from psychopy import visual, core
import numpy as np
import random



# Setup Window
win = visual.Window(size=(500,500), fullscr=False, color=(0,0,0), units='cm', monitor='testMonitor')




def chanceDisplay(prob):
    angle = prob * 360
    print(angle)

    # draw the arc
    wedge = visual.RadialStim(win, tex='sqrXsqr', color='green', size=6,
                visibleWedge=[0, angle], radialCycles=1, angularCycles=0, angularRes=360,
                interpolate=False, units='cm')

    # draw the circle to hide the center
    cover = visual.Circle(win, radius=2, edges=100, lineColor=None, fillColor=[0,0,0])

    wedge.draw()
    cover.draw()




# Draw textures
waitForDD_msg = visual.TextStim(win, text='Waiting for disdaqs')
rest_msg = visual.TextStim(win, text='REST')
motor_msg = visual.TextStim(win, text='MOTOR IMAGERY')
end_msg = visual.TextStim(win, text='All done!')


wedge = visual.RadialStim(win, tex='sqrXsqr', color='green', size=6,
            visibleWedge=[0, 181], radialCycles=1, angularCycles=0,
            interpolate=False, units='cm')
cover = visual.Circle(win, radius=2, edges=100, lineColor=None, fillColor=[0,0,0])


##### Start Task ------------------


# loop over trials
for t in range(4):
    # rest trial
    rest_msg.draw()
    win.flip()
    core.wait(.5)

    # motor imagery trial
    chanceDisplay(random.random())
    win.flip()
    core.wait(2)


end_msg.draw()
win.flip()
core.wait(.1)
