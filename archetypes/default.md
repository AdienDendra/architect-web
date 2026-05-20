---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
translationKey: "post-{{ .File.ContentBaseName }}"
date: {{ .Date }}
tags: []
categories: []
---
<style>
  .post-content {
    font-size: 16px;
    line-height: 1.4;
  }
</style>