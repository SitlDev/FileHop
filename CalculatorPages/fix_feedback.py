import os
import re

def standardize_feedback(content):
    standard_html = """
            <!-- Feedback & Community Thread -->
            <section class="feedback-section" style="margin-top: 64px;">
                <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 40px;">
                    <h3 style="font-size: 24px; margin-bottom: 8px;">Community Discussion</h3>
                    <p style="color: var(--muted); font-size: 14px; margin-bottom: 32px;">Missing a feature? Report it here to join the roadmap.</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <input type="text" id="feedbackName" placeholder="Your Name" style="background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; color: var(--text);">
                        <input type="email" id="feedbackEmail" placeholder="Email (Optional)" style="background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; color: var(--text);">
                    </div>
                    <textarea id="feedbackComment" placeholder="Share your suggestion or feedback..." style="width: 100%; height: 120px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; color: var(--text); font-family: inherit; resize: none; margin-bottom: 24px; border: 1px solid var(--border);"></textarea>
                    
                    <button class="btn-calculate btn-feedback" style="width: auto; padding: 0 40px;" onclick="submitFeedback()">Post to Thread</button>
                    
                    <div class="comment-thread" style="margin-top: 40px; border-top: 1px solid var(--border); padding-top: 40px;">
                        <div style="margin-bottom: 24px;">
                            <div style="font-size: 13px; color: var(--muted); margin-bottom: 4px;"><strong>Marcus R.</strong> • 2 days ago</div>
                            <div style="font-size: 14px; color: var(--text); line-height: 1.6;">"The new 'Audio room mode' tool is incredibly accurate for my home studio setup. Would love to see a speaker placement calculator next!"</div>
                        </div>
                    </div>
                </div>
            </section>
"""
    
    # 1. If it exists, replace it
    feedback_pattern = re.compile(r'<section class="feedback-section"[\s\S]*?</section>', re.IGNORECASE)
    if feedback_pattern.search(content):
        content = feedback_pattern.sub(standard_html, content)
    else:
        # 2. If it doesn't exist, inject before closing container inside main
        if '</div>\n    </main>' in content:
            content = content.replace('</div>\n    </main>', standard_html + '</div>\n    </main>')
        elif '</div>\n</main>' in content:
             content = content.replace('</div>\n</main>', standard_html + '</div>\n</main>')
        else:
             # Fallback
             content = content.replace('</main>', standard_html + '</main>')

    # 3. Remove local submitFeedback function
    # Standard variation
    content = re.sub(r'function submitFeedback\(\) \{[\s\S]*?\n\s+\}', '', content)
    # Inline/Minified variation
    content = re.sub(r'function submitFeedback\(\)[\s\S]*?\}', '', content, count=1) 
    
    return content

for filename in os.listdir('.'):
    if filename.endswith('.html'):
        path = os.path.join('.', filename)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = standardize_feedback(content)
        
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Standardized {filename}")
