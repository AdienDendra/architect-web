document.addEventListener("DOMContentLoaded", () => {
  const toolsPage = document.querySelector("[data-tools-page]");

  if (!toolsPage) {
    return;
  }

  const filterButtons = Array.from(toolsPage.querySelectorAll("[data-filter-kind]"));
  const toolCards = Array.from(toolsPage.querySelectorAll("[data-tool-card]"));
  const toolSections = Array.from(toolsPage.querySelectorAll("[data-tool-section]"));
  const emptyState = toolsPage.querySelector("[data-tool-empty]");

  const applyFilter = (kind, value) => {
    let visibleCount = 0;

    toolCards.forEach((card) => {
      const shouldShow = kind === "all" || card.getAttribute(`data-${kind}`) === value;
      card.hidden = !shouldShow;

      if (shouldShow) {
        visibleCount += 1;
      }
    });

    toolSections.forEach((section) => {
      const cards = Array.from(section.querySelectorAll("[data-tool-card]"));
      section.hidden = !cards.some((card) => !card.hidden);
    });

    filterButtons.forEach((button) => {
      const isActive = button.dataset.filterKind === kind && button.dataset.filterValue === value;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.filterKind, button.dataset.filterValue);
    });
  });
});
