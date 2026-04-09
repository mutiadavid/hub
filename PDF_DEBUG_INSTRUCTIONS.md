# PDF Generation Debug Instructions

## Changes Made

1. **Made temp container VISIBLE during generation** (was hidden before)
   - Position: `absolute` at `top: 0, left: 0`
   - Z-index: `99999` (appears on top)
   - This lets you SEE if HTML is rendering

2. **Added Console Logging**
   - HTML content length
   - Temp div dimensions
   - Canvas creation details
   - html2canvas logging enabled

3. **Increased render wait time** from 500ms to 1000ms

## How to Debug

1. **Open Browser Console** (F12)

2. **Try to Generate PDF**

3. **Watch for**:
   - A white container should briefly appear on screen showing the PDF content
   - Console logs showing:
     ```
     PDF HTML Content Generated: { length: XXXX, hasChecklist: true, docsCount: X }
     Temp div appended, waiting for render...
     Canvas created: { width: XXX, height: XXX, hasData: true }
     ```

4. **If you see the container but PDF is still blank**:
   - The HTML is rendering ✓
   - Problem is with canvas capture
   - Check canvas logs

5. **If container doesn't appear**:
   - HTML generation failed
   - Check `PDF HTML Content Generated` log
   - Checklist data might be missing

## Expected Behavior

- You should see a white box flash on screen for ~1 second
- This box should contain your checklist data
- If it's blank, the data isn't being passed correctly
- If it has content, the issue is with html2canvas

## Next Steps After Testing

Send me:
1. Screenshot of what appears in the white container (if anything)
2. Console logs
3. I'll know exactly where the problem is!

## Once Fixed

After we confirm PDFs are working, I'll:
1. Hide the container again (`position: fixed, top: -10000px`)
2. Disable console logging
3. Move on to fixing supporting docs upload
