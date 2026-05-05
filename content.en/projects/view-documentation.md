---
title: "Markdown Documentation"
translationKey: "view-documentation"
date: 2026-05-04T17:58:00+10:00
tags: ["sydney", "documentation", "travel", "fishing", "family"]
categories: ["story"]
author: "Adien Dendra"
ShowToc: true
TocOpen: false
---
{{< collapse title="Python format" collapse="true" >}}
```python
def solve_creature_rig(node):
    print(f"Processing: {node}")
    return True
```
{{< /collapse >}}

<div align="center">
  This mermaid diagram is <mark>in the center</mark>.
</div>

{{< mermaid >}}
graph TD;
    A[Data from Open-meteo] -->|Send Data| B(Cloud Server);
    B --> C{Detect Danger?};
    C -->|Yes| D[Send Notification to Phone];
    C -->|No| E[Log to Database];

{{< /mermaid >}}

{{< mermaid >}}
graph LR
    A[Start] --> B(Process 1)
    B --> C{Decision}
    C -->|Yes| D[Finish]
    C -->|No| E[Repeat]
{{< /mermaid >}}

```markdown
Explanation of Direction Codes:  
Besides LR, there are several other direction options in Mermaid:
LR (Left to Right): The diagram extends horizontally (left to right).
RL (Right to Left): The diagram extends from right to left.
TB or TD (Top to Bottom / Top Down): The diagram extends downward (default).
BT (Bottom to Top): The diagram extends upward.
```

{{< collapse title="Katex format" >}}
```\small (a little smaller)
\footnotesize (footnote size)
\scriptsize (quite small)
\tiny (smallest)
```
The basic energy formula is $\scriptsize E = mc^2$
$$
\small \text{CloudCost} = \sum_{i=1}^{n} (\text{Instance}_{i} \times \text{Hours})
$$
{{< /collapse >}}


{{< collapse title="Syntax Markdown" collapse="true">}}
# Heading 1 (Largest)
## Heading 2
### Heading 3
#### Heading 4

- Item one
- Item two
  - Sub-item (add space/tab)

## 1. Introduction
This is a paragraph with **Bold** and *Italic* text. Don’t forget to check ~~other content~~.

## 2. Unordered list
* Rod
* Reel
* Life Jacket

## 3. Ordered list
1. Wear a helmet.
2. Check left and right.
3. Go!

> Note: Family is the top priority

1. First
    2. Second
    3. Third

### 4. Nested Unordered list
- Fishing Safety Equipment
  - Life Jacket
  - Cleat
    - Size XL
    - Size L
- Medical Equipment

### 5. Nested ordered list
1. Preparation Stage
   1. Check Reel
   2. Check Rod
2. Walk to the spot
   1. Casting!

### 6. Mix
1. Shopping List
   - A4 Paper
   - Printer Ink
2. Task List
   - Send Email
   - Update Website

- [x] Task completed
- [ ] Task not completed

### 7. Font Size
In standard Markdown you **cannot** freely change font size (like in Word). Size is controlled by **Headings**.
*   If you want smaller text, you usually use deeper Headings (like `####`).
*   If you want full customization, markdown must use HTML tags: `<span style="font-size:20px">Big Text</span>`.

### 8. Blockquotes (Quotes)
Use the greater-than symbol `>`.
```markdown
> "A good cloud architecture is one that is secure and efficient."
```
### 9. Table
```markdown
Align:
:--- : Left Align (Default)
:---: : Center Align
---: : Right Align
```
| No | Component | Status |
| :--- | :---: | ---: |
| 1 | Fishing Gear | **OK** |
| 2 | Rod dan reel | *Maintenance* |
| 3 | Live vest dan cleat | ~~Rusak~~ |

### 10. Inline Markdown dalam Tabel
| Format | Writing Example |
| :--- | :--- |
| **Bold** | `**Bold**` |
| *Italic* | `*Italic*` |
| `Code` | `` `Code` `` |
| [Link](https://google.com) | `[Link](url)` |

{{< collapse title="11. Collapse Expand" >}}
All the secrets are here…
{{< /collapse >}}
{{< /collapse >}}

---