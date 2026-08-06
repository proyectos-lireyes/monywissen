import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

# the modal starts with `{showCustomDebtModal && (`
split_modal = content.split("      {showCustomDebtModal && (")
if len(split_modal) > 1:
    content_part1 = split_modal[0]
    # find the end of the modal. 
    # it ends before `<ItemFormModal`
    end_modal_idx = split_modal[1].find("      <ItemFormModal")
    if end_modal_idx != -1:
        new_content = content_part1 + split_modal[1][end_modal_idx:]
        with open('src/components/debts/DebtsView.tsx', 'w') as f:
            f.write(new_content)
