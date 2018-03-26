"""
Motor Imagery Task
"""

from psychopy import visual, core




# Setup Window
win = visual.Window()

# Draw textures
waitForDD_msg = visual.TextStim(win, text='Waiting for disdaqs')
rest_msg = visual.TextStim(win, text='REST')
motor_msg = visual.TextStim(win, text='MOTOR IMAGERY')
end_msg = visual.TextStim(win, text='All done!')

##### Start Task ------------------

# dd
waitForDD_msg.draw()
win.flip()
core.wait(3)

# loop over trials
for t in range(4):
    # rest trial
    rest_msg.draw()
    win.flip()
    core.wait(5)

    # motor imagery trial
    motor_msg.draw()
    win.flip()
    core.wait(5)


end_msg.draw()
win.flip()
core.wait(1)
